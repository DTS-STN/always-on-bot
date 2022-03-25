import {
    ComponentDialog, ConfirmPrompt, WaterfallDialog
} from 'botbuilder-dialogs';
import i18n from '../../locales/i18nConfig';
import { ContinueAndFeedbackStep, CONTINUE_AND_FEEDBACK_STEP } from '../../common/continueAndFeedbackStep';

const CONFIRM_PROMPT = 'CONFIRM_PROMPT';

export const APPLICATION_STATUS_STEP = 'APPLICATION_STATUS_STEP';
const APPLICATION_STATUS_WATERFALL_STEP = 'APPLICATION_STATUS_WATERFALL_STEP';

// Define the main dialog and its related components

export class ApplicationStatusStep extends ComponentDialog {
    constructor() {
        super(APPLICATION_STATUS_STEP);

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new ContinueAndFeedbackStep())
            .addDialog(new WaterfallDialog(APPLICATION_STATUS_WATERFALL_STEP, [

                this.checkProfileStep.bind(this)
            ]));

        this.initialDialogId = APPLICATION_STATUS_WATERFALL_STEP;
    }

   /**
    * This is the final step in the main waterfall dialog.
    * Bot displays the Payment due amount and next payment details..etc.
    */
    private async checkProfileStep(stepContext) {

        await stepContext.context.sendActivity(i18n.__('oasBenefitCheckProfile'));
        await stepContext.context.sendActivity(i18n.__('oasBenefitPaymentDue'));
        await stepContext.context.sendActivity(i18n.__('oasBenefitShowDeposit'));
        return await stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_STEP, ContinueAndFeedbackStep);
    }
}