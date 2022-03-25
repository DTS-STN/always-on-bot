import {
    Choice, ChoicePrompt, ComponentDialog,
    ConfirmPrompt, DialogTurnResult, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../../models/commonPromptValidatorModel';
import i18n from '../../../locales/i18nConfig';
import { ContinueAndFeedbackStep, CONTINUE_AND_FEEDBACK_STEP } from '../../../common/continueAndFeedbackStep';
import { FeedBackStep, FEED_BACK_STEP } from '../../../common/feedBackStep';
import { CommonCallBackStep, COMMON_CALL_BACK_STEP } from '../commonCallBackStep';

const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

export const CONFIRM_EMAIL_STEP = 'CONFIRM_EMAIL_STEP';
const CONFIRM_EMAIL_WATERFALL_STEP = 'CONFIRM_EMAIL_WATERFALL_STEP';

// Define the main dialog and its related components.
export class ConfirmEmailStep extends ComponentDialog {
    constructor() {
        super(CONFIRM_EMAIL_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new ContinueAndFeedbackStep())
            .addDialog(new FeedBackStep())
            .addDialog(new CommonCallBackStep())
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(CONFIRM_EMAIL_WATERFALL_STEP, [
                this.askEmailStep.bind(this),
                this.updatedStep.bind(this)
            ]));

        this.initialDialogId = CONFIRM_EMAIL_WATERFALL_STEP;
    }
    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
     *  Initial step in the waterfall. This will kick off the confirmPhoneNumberStep
     *  prompt user to enter the phone number and covers the case where user enters invalid phone number
     */
    async askEmailStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult>{
        const details= stepContext.options as CommonPromptValidatorModel;
        if(details.retryCount === 0)
        {
            return await stepContext.prompt(TEXT_PROMPT, i18n.__('AskEmailAddress'))
        }
        else if(details.retryCount < details.maxRetryCount)
        {
            return await stepContext.prompt(TEXT_PROMPT, i18n.__('ConfirmEmailRetryPromptMessage'))
        }
        else if(details.retryCount === details.maxRetryCount){
            const commonPromptValidatorModel = new CommonPromptValidatorModel(
                ['YesIWantToRequestCall', 'NoNotForNow'],
                2,
                'ConfirmEmailCallBack',i18n.__('ConfirmEmailCallBackPromptMessage')
            );
           return await stepContext.replaceDialog(COMMON_CALL_BACK_STEP,commonPromptValidatorModel);
        }
    }
    // confirm the users intent to proceed with the step
    async updatedStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {
        const details = stepContext.options as CommonPromptValidatorModel ;
        // ask the user to confirm the phone number and save it to the system
        const Emailaddress = stepContext.result;
        if(Emailaddress){
            let validEmailaddress:boolean;
            let updatedstatement = i18n.__('EmailAddressConfirmStep')
            validEmailaddress = this.validateEmailaddress(Emailaddress);
            if(validEmailaddress){
                updatedstatement = updatedstatement.replace('@email',Emailaddress);
                await stepContext.context.sendActivity(updatedstatement);
                await stepContext.context.sendActivity(i18n.__('SetStep'));
                return stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_STEP,null);
            }
            else{
                details.retryCount = details.retryCount+1;
                return stepContext.replaceDialog(CONFIRM_EMAIL_STEP,details);
            }
        }
        else{
            return await stepContext.beginDialog(FEED_BACK_STEP,null);
        }
    }
    private validateEmailaddress(response:string)
    {
        let reg = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/
        let validEmail:boolean = false;
        reg = new RegExp(reg);
        if(response.match(reg))
        {
            validEmail = true;
        }
        return validEmail;
    }
}
