import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoicePrompt, ComponentDialog,
    ConfirmPrompt, DialogTurnResult, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../../models/commonPromptValidatorModel';
import i18n from '../../../locales/i18nConfig';
import { LUISAlwaysOnBotSetup } from '../../alwaysOnBotRecognizer';
import { ContinueAndFeedbackStep, CONTINUE_AND_FEEDBACK_STEP } from '../../../common/continueAndFeedbackStep';
import { CommonCallBackStep, COMMON_CALL_BACK_STEP } from '../commonCallBackStep';
import validatePhoneNumber from '../../../../utils/validateCanadianPhoneNumber';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PHONE_NUMBER_WATERFALL_STEP = 'CONFIRM_PHONE_NUMBER_WATERFALL_STEP';
export const CONFIRM_PHONE_NUMBER_STEP = 'CONFIRM_PHONE_NUMBER_STEP';
// Define the main dialog and its related components.
export class ConfirmPhoneNumberStep extends ComponentDialog {
    constructor() {
        super(CONFIRM_PHONE_NUMBER_STEP);
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new ContinueAndFeedbackStep())
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new CommonCallBackStep())
            .addDialog(new WaterfallDialog(CONFIRM_PHONE_NUMBER_WATERFALL_STEP, [
                this.askPhoneNumberStep.bind(this),
                this.updatedStep.bind(this)
            ]));
        this.initialDialogId = CONFIRM_PHONE_NUMBER_WATERFALL_STEP;
    }
    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
     *  Initial step in the waterfall. This will kick off the confirmPhoneNumberStep
     *  prompt user to enter the phone number and covers the case where user enters invalid phone number
     */
    async askPhoneNumberStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult>{
        const details= stepContext.options as CommonPromptValidatorModel;
        if(details.retryCount === 0)
        {
            return await stepContext.prompt(TEXT_PROMPT, i18n.__('AskPhoneNUmber'))
        }
        else if(details.retryCount<details.maxRetryCount)
        {
            return await stepContext.prompt(TEXT_PROMPT, i18n.__('ConfirmPhoneNumberRetryPromptMessage'))
        }
        else if(details.retryCount>=details.maxRetryCount){
            const exceededRetryMessage = i18n.__('ConfirmPhoneNumberRetryExceededMessage');
            const commonPromptValidatorModel = new CommonPromptValidatorModel(
                ['YesIWantToRequestCall', 'NoNotForNow'],
                Number(i18n.__('MaxRetryCount')),
                'ConfirmPhoneNumberCallBack',i18n.__('ConfirmPhoneNumberCallBackPromptMessage')
            );
            return stepContext.replaceDialog(COMMON_CALL_BACK_STEP, commonPromptValidatorModel);
        }
    }
    // confirm the users intent to proceed with the step
    async updatedStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {
        const details=stepContext.options as CommonPromptValidatorModel ;
            const PhoneNumber = stepContext.result;
            let validPhoneNumber:string;
            let updatedStatement = i18n.__('PhoneNumberConfirmStep')
            validPhoneNumber = validatePhoneNumber(PhoneNumber);
            if(validPhoneNumber){
                updatedStatement = updatedStatement.replace('@phoneNumber',validPhoneNumber);
                await stepContext.context.sendActivity(updatedStatement);
                await stepContext.context.sendActivity(i18n.__('SetStep'));
                return stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_STEP,ContinueAndFeedbackStep);
            }
            else{
                details.retryCount = details.retryCount+1;
                return stepContext.replaceDialog(CONFIRM_PHONE_NUMBER_STEP,details);
            }

    }

}