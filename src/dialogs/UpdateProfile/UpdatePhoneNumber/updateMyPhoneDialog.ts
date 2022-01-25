import {
    Choice, ChoicePrompt, ComponentDialog, PromptValidatorContext, TextPrompt,
    WaterfallDialog
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../models/commonPromptValidatorModel';
import { ContinueAndFeedbackDialog } from '../../Common/continueAndFeedbackDialog';
import i18n from '../../locales/i18nconfig';
import { COMMON_CHOICE_CHECK_DIALOG } from './commonChoiceCheckDialog';
import { confirmPhoneNumber } from './confirmPhoneNumberDialog';


const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PHONE_NUMBER_DIALOG_STEP = 'CONFIRM_PHONE_NUMBER_DIALOG_STEP';


export const UPDATE_PHONE_NUMBER_DIALOG_STEP = 'UPDATE_PHONE_NUMBER_DIALOG_STEP';
// Define the main dialog and its related components.
export class UpdateMyPhoneDialog extends ComponentDialog {
    constructor() {
        super(UPDATE_PHONE_NUMBER_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new confirmPhoneNumber())
            .addDialog(new ContinueAndFeedbackDialog)
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.checkPhoneNumberStep.bind(this),
                this.routingStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async checkPhoneNumberStep(stepContext) {

        let commonPromptValidatorModel = new CommonPromptValidatorModel(
            ["Yes", "No"],
            3,
            'UpdateMyPhoneNumber'
        );
        //call dialog
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_DIALOG, commonPromptValidatorModel);
        
    }
    /**
    * Selection step in the waterfall.
    * Bot chooses the flows(UpdateMyAddress,UpdateDirectDeposit) based on user's input.
    */
    async routingStep(stepContext) {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status) {
            switch (commonPromptValidatorModel.result) {
                case 'Yes':
                    commonPromptValidatorModel.retryCount=0;
                    return await stepContext.beginDialog(CONFIRM_PHONE_NUMBER_DIALOG_STEP, commonPromptValidatorModel);
                case 'No':
                    await stepContext.context.sendActivity(i18n.__('NoStatemnetPhoenNumber'));
                    return stepContext.beginDialog('CONTINUE_AND_FEEDBACK_DIALOG_STEP', ContinueAndFeedbackDialog);
            }
        }
        
    }
}