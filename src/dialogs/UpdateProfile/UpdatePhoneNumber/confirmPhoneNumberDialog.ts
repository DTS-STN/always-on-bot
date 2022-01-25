import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog,
    ConfirmPrompt, DialogTurnResult, ListStyle, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../models/commonPromptValidatorModel';
import { LUISAOSetup } from '../../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../../Common/continueAndFeedbackDialog';
import i18n from '../../locales/i18nconfig';

const CONFIRM_PROMPT = 'confirmPrompt';
const continue_And_Feedback_Dialog = 'CONTINUE_AND_FEEDBACK_DIALOG_STEP';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

export const CONFIRM_PHONE_NUMBER_DIALOG_STEP = 'CONFIRM_PHONE_NUMBER_DIALOG_STEP';
// Define the main dialog and its related components.
export class confirmPhoneNumber extends ComponentDialog {
    constructor() {
        super(CONFIRM_PHONE_NUMBER_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.askPhoneNumberStep.bind(this),
                this.updatedStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    async askPhoneNumberStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult>{
        const details= stepContext.options as CommonPromptValidatorModel;
        if(details.retryCount==0)
        {
            return await stepContext.prompt(TEXT_PROMPT, i18n.__('AskPhoneNUmber'))
        }
        else if(details.retryCount<=details.maxRetryCount)
        {
            return await stepContext.prompt(TEXT_PROMPT, i18n.__('ConfirmPhoneNumberRetryPromptMessage'))
        }
        else if(details.retryCount>details.maxRetryCount){
            const exceededRetryMessage = i18n.__('ConfirmPhoneNumberRetryExceededMessage');
            
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt: exceededRetryMessage,
                choices: ChoiceFactory.toChoices(i18n.__('ConfirmPhoneNumberRetryExceededChoices')),
                style: ListStyle.suggestedAction
            });

        }
    }
    async updatedStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {
        let details=stepContext.options as CommonPromptValidatorModel ;
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);
        if(stepContext.result.value){
            switch(intent)
            {
                case 'Yes':
                    return await stepContext.cancelAllDialogs();
                case 'No':
                    return await stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP,ContinueAndFeedbackDialog);
            }
        }
        else
        {
            const PhoneNumber=stepContext.result;
            let validphonenumber:boolean;
            let updatedstatement=i18n.__('PhoneNumberConfirmStep')
            validphonenumber=this.validatePhoneNumber(PhoneNumber);
            if(validphonenumber){
                updatedstatement=updatedstatement.replace("@phoneNumber",PhoneNumber);
                await stepContext.context.sendActivity(updatedstatement);
                await stepContext.context.sendActivity(i18n.__('SetStep'));
                return stepContext.replaceDialog('CONTINUE_AND_FEEDBACK_DIALOG_STEP',ContinueAndFeedbackDialog);
            }
            else{
                details.retryCount=details.retryCount+1;
                return stepContext.replaceDialog(CONFIRM_PHONE_NUMBER_DIALOG_STEP,details);
            }
        }
    }
    private validatePhoneNumber(response:string)
    {
        let reg=/[0-9][0-9][0-9]-[0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]/
        let validphone:boolean=false;
        reg=new RegExp(reg);
        if(response.match(reg))
        {
        validphone=true;
        }
        
        return validphone;
    }
}