import {
    ComponentDialog, WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { ConfirmExitDirectDepositChequePromptDialog, CONFIRM_EXIT_DIRECT_DEPOSIT_CHEQUE_DAILOG_STEP } from './confirmExitDirectDepositAccountDialog';
import { DirectDepositAccountDialog, DIRECT_DEPOSIT_ACCOUNT_DIALOG_STEP } from './directDepositAccountDialog';
import { DirectDepositDetails } from './directDepositDetails';
const WATERFALL_DIALOG = 'waterfallDialog';
const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const NUMBER_PROMPT = 'numberPrompt';

export const DIRECT_DEPOSIT_ACCOUNT_INTEGRATION_DIALOG_STEP = 'DIRECT_DEPOSIT_ACCOUNT_INTEGRATION_DIALOG_STEP';

// Define the main dialog and its related components.
export class DirectDepositAccountIntegrationDialog extends ComponentDialog {
    constructor() {
        super(DIRECT_DEPOSIT_ACCOUNT_INTEGRATION_DIALOG_STEP);

        this.addDialog(new DirectDepositAccountDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.initiationStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

     /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async initiationStep(stepContext: WaterfallStepContext){
        const directDepositdetails =new DirectDepositDetails(); 
        let DirectDepositDialogRetryDetails = stepContext.options as directDepositDialogRetryDetails;
        if (DirectDepositDialogRetryDetails != undefined && DirectDepositDialogRetryDetails.isRetryInitiated){
            return await stepContext.beginDialog(CONFIRM_EXIT_DIRECT_DEPOSIT_CHEQUE_DAILOG_STEP, ConfirmExitDirectDepositChequePromptDialog);
        }
        return await stepContext.beginDialog(DIRECT_DEPOSIT_ACCOUNT_DIALOG_STEP,directDepositdetails);
    }

   /**
   * This is the final step in the main waterfall dialog.
   */
    async finalStep(stepContext: WaterfallStepContext){
        let accountDialogDetials = stepContext.result;
        if (accountDialogDetials != undefined && accountDialogDetials == true)
        {
            return await stepContext.beginDialog(DIRECT_DEPOSIT_ACCOUNT_INTEGRATION_DIALOG_STEP, new directDepositDialogRetryDetails(true));
        }
        return await stepContext.endDialog();
    }

}
export class directDepositDialogRetryDetails{
    public isRetryInitiated: boolean;
    constructor(isRetry){
        this.isRetryInitiated = isRetry;
    }
}