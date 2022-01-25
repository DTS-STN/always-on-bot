import {
    ComponentDialog, ConfirmPrompt, WaterfallDialog,PromptValidatorContext, ChoiceFactory,Choice,ListStyle,ChoicePrompt, WaterfallStepContext,DialogTurnResult
} from 'botbuilder-dialogs';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../Common/continueAndFeedbackDialog';
import i18n from '../locales/i18nconfig';
import { COMMON_CHOICE_CHECK_DIALOG,CommonChoiceCheckDialog } from '../UpdateProfile/UpdatePhoneNumber/commonChoiceCheckDialog';

import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';

const WATERFALL_DIALOG = 'waterfallDialog';
const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';

export const APPLICATION_STATUS_DIALOG_STEP = 'APPLICATION_STATUS_DIALOG_STEP';

// Define the main dialog and its related components.

export class ApplicationStatusDialog extends ComponentDialog {
    constructor() {
        super(APPLICATION_STATUS_DIALOG_STEP);

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
               
                this.checkProfileStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
    
   /**
   * This is the final step in the main waterfall dialog.
   * Bot displays the Payment due amount and next payment details..etc.
   */
    private async checkProfileStep(stepContext) {

        await stepContext.context.sendActivity(i18n.__('oasBenifitCheckProfile'));
        await stepContext.context.sendActivity(i18n.__('oasBenifitPaymentDue'));
        await stepContext.context.sendActivity(i18n.__('oasBenifitShowDeposit'));
        return await stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP, ContinueAndFeedbackDialog);
    }
}