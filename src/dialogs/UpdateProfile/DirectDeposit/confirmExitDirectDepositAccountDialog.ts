import { LuisRecognizer } from 'botbuilder-ai';
import {
    ChoiceFactory, ChoicePrompt, ComponentDialog, ListStyle, WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../../utils/luisAppSetup';
import i18n from '../../locales/i18nconfig';
import { DirectDepositAccountDialog, DIRECT_DEPOSIT_ACCOUNT_DIALOG_STEP } from './directDepositAccountDialog';

const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'choicePrompt';
const TEXT_PROMPT = 'textPrompt';
const NUMBER_PROMPT = 'numberPrompt';

export const CONFIRM_EXIT_DIRECT_DEPOSIT_CHEQUE_DAILOG_STEP = 'CONFIRM_EXIT_DIRECT_DEPOSIT_CHEQUE_DAILOG_STEP';

// Define the main dialog and its related components.
export class ConfirmExitDirectDepositChequePromptDialog extends ComponentDialog {
    constructor() {
        super(CONFIRM_EXIT_DIRECT_DEPOSIT_CHEQUE_DAILOG_STEP);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
            .addDialog(new DirectDepositAccountDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.confirmExitPromptStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
   /**
   * Confirm Exit step in the waterfall.
   * ask users to provide the decesion-Yes or No before we call to call-back flow
   */
    public async confirmExitPromptStep(stepContext: WaterfallStepContext) {
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: i18n.__('DirectDepositExitPrompt'),
            choices: ChoiceFactory.toChoices(i18n.__('DirectDepositExitchoices')),
            style: ListStyle.suggestedAction
        });
    }
   /**
   * This is the final step in the main waterfall dialog.
   */
    async finalStep(stepContext: WaterfallStepContext) {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
         // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                return await stepContext.endDialog(this.id);
            case 'No':
                return await stepContext.replaceDialog(DIRECT_DEPOSIT_ACCOUNT_DIALOG_STEP, DirectDepositAccountDialog);
        }
    }
}