import { MessageFactory } from 'botbuilder';
import {
    ComponentDialog, NumberPrompt, PromptOptions, PromptValidatorContext, WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { DirectDepositChequePromptDetails } from '../../../models/DirectDepositChequePromptDetails';
import i18n from '../../locales/i18nconfig';
const WATERFALL_DIALOG = 'waterfallDialog';
const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const NUMBER_PROMPT = 'numberPrompt';

export const DIRECT_DEPOSIT_CHEQUE_PROMPT_DIALOG_STEP = 'DIRECT_DEPOSIT_CHEQUE_PROMPT_DIALOG_STEP';

// Define the main dialog and its related components.
export class DirectDepositChequePromptDialog extends ComponentDialog {
    constructor() {
        super(DIRECT_DEPOSIT_CHEQUE_PROMPT_DIALOG_STEP);

        this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.CustomNumberPromptValidator))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.chequeDetailsPromptStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    private async CustomNumberPromptValidator(promptContext: PromptValidatorContext<number>) {
        let validations = promptContext.options.validations as DirectDepositChequePromptDetails;

        if (promptContext.recognized.succeeded) {
            if (promptContext.recognized.value.toString().length == validations.numberLength) {
                return true;
            }
            promptContext.recognized.value = undefined;
        }

        if (promptContext.attemptCount < 3) {
            return false;
        }
        return true;
    }
     /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * retry for user's input message if its not in right format.
     */
    public async chequeDetailsPromptStep(stepContext: WaterfallStepContext<DirectDepositChequePromptDetails>) {
        let directDepositChequePromptDetails = stepContext.options as DirectDepositChequePromptDetails;
        let opt: Partial<PromptOptions> = {
            prompt: MessageFactory.text(i18n.__(`DirectDeposit${directDepositChequePromptDetails.promptType}Prompt`)),
            validations: directDepositChequePromptDetails,
            retryPrompt: MessageFactory.text(i18n.__(`DirectDeposit${directDepositChequePromptDetails.promptType}RetryPrompt`))
        };
        return await stepContext.prompt(NUMBER_PROMPT, opt);
    }
   /**
   * This is the final step in the main waterfall dialog.
   */
    public async finalStep(stepContext: WaterfallStepContext<DirectDepositChequePromptDetails>) {
        let directDepositChequePromptDetails = stepContext.options as DirectDepositChequePromptDetails;
        let result = stepContext.result;
        if (result == undefined) {
            return await stepContext.endDialog(directDepositChequePromptDetails);
        }
        directDepositChequePromptDetails.resultText = result;
        return await stepContext.endDialog(directDepositChequePromptDetails);
    }

}