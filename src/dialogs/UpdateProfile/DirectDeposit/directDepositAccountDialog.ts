// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { StatePropertyAccessor, TurnContext } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import {
    ChoiceFactory, ChoicePrompt, ComponentDialog,
    DialogSet,
    DialogState, DialogTurnStatus, ListStyle,
    PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { Choice } from 'botbuilder-dialogs/src/choices/findChoices';
import { adaptiveCard } from '../../../cards';
import { declaration } from '../../../cards/declaration';
import { directdeposit, directdepositcheque } from '../../../cards/directdeposit';
import { DirectDepositChequePromptDetails } from '../../../models/DirectDepositChequePromptDetails';
import { LUISAOSetup } from '../../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../../Common/continueAndFeedbackDialog';
import i18n from '../../locales/i18nconfig';
import { DirectDepositChequePromptDialog, DIRECT_DEPOSIT_CHEQUE_PROMPT_DIALOG_STEP } from './directDepositChequePromptDialog';
import { DirectDepositDetails } from './directDepositDetails';

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

export const DIRECT_DEPOSIT_ACCOUNT_DIALOG_STEP = 'DIRECT_DEPOSIT_ACCOUNT_DIALOG_STEP';

export class DirectDepositAccountDialog extends ComponentDialog {

    constructor() {
        super(DIRECT_DEPOSIT_ACCOUNT_DIALOG_STEP);

        // Define the main dialog and its related components.

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new DirectDepositChequePromptDialog())
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.transitNumberStep.bind(this),
                this.accountNumberStep.bind(this),
                this.institutionNumberStep.bind(this),
                this.declarationStep.bind(this),
                this.confirmStep.bind(this),
                this.feedbackStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }
    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {TurnContext} context
     */
    public async run(context: TurnContext, accessor: StatePropertyAccessor<DialogState>) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    // validates all the prompts
    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }

    /**
    * Transit Number step in the waterfall.
    * First,bot displays the deposit cheque to the users
    * second,captures the Transit Number from the cheque
    */
    private async transitNumberStep(stepContext: WaterfallStepContext) {
        await adaptiveCard(stepContext, directdeposit(stepContext.context.activity.locale));
        await adaptiveCard(stepContext, directdepositcheque(stepContext.context.activity.locale));
        let directDepositChequePromptDetails = new DirectDepositChequePromptDetails('TransitNumber');
        return await stepContext.beginDialog(DIRECT_DEPOSIT_CHEQUE_PROMPT_DIALOG_STEP, directDepositChequePromptDetails);
    }
    /**
    * Account Number step in the waterfall.
    * Captures the Account Number from the cheque
    */
    private async accountNumberStep(stepContext: WaterfallStepContext<DirectDepositDetails>) {
        let directDepositChequePromptDetails = stepContext.result as DirectDepositChequePromptDetails;
        let DirectDepositDetails = stepContext.options as DirectDepositDetails;
        if (directDepositChequePromptDetails.resultText == undefined) {
            return await stepContext.endDialog(true);
        }
        DirectDepositDetails.transitNumber = directDepositChequePromptDetails.resultText;
        directDepositChequePromptDetails = new DirectDepositChequePromptDetails('AccountNumber');
        return await stepContext.beginDialog(DIRECT_DEPOSIT_CHEQUE_PROMPT_DIALOG_STEP, directDepositChequePromptDetails);
    }
    /**
    * Institutions number step in the waterfall.
    * Captures the Financial Institutions numbers from the cheque
    */
    private async institutionNumberStep(stepContext: WaterfallStepContext) {
        let directDepositChequePromptDetails = stepContext.result as DirectDepositChequePromptDetails;
        let DirectDepositDetails = stepContext.options as DirectDepositDetails;
        if (directDepositChequePromptDetails.resultText == undefined) {
            return await stepContext.endDialog(true);
        }
        DirectDepositDetails.accountNumber = directDepositChequePromptDetails.resultText;
        directDepositChequePromptDetails = new DirectDepositChequePromptDetails('InstitutionNumber');
        return await stepContext.beginDialog(DIRECT_DEPOSIT_CHEQUE_PROMPT_DIALOG_STEP, directDepositChequePromptDetails);
    }
    /**
    * Declaration step in the waterfall.
    * Ask user to provide the confirmation for the captured values(Transit Number,Account Number,Financial Institutions number)
    */
    private async declarationStep(stepContext: WaterfallStepContext) {
        let directDepositChequePromptDetails = stepContext.result as DirectDepositChequePromptDetails;
        let DirectDepositDetails = stepContext.options as DirectDepositDetails;
        if (directDepositChequePromptDetails.resultText == undefined) {
            return await stepContext.endDialog(true);
        }
        DirectDepositDetails.institutionNumber = directDepositChequePromptDetails.resultText;
        await adaptiveCard(stepContext, declaration(DirectDepositDetails.transitNumber,
            DirectDepositDetails.accountNumber,
            DirectDepositDetails.institutionNumber,
            stepContext.context.activity.locale));
        let promptMsg = i18n.__('DirectDepositCorrectText');
        let promptOptions: Array<string>;
        promptOptions = i18n.__('continueAndFeedChoices');
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptMsg,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.suggestedAction
        });
    }
   /**
   * This is the users further assistance promt step.
   */
    private async confirmStep(stepContext) {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
         // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                await stepContext.context.sendActivity(i18n.__('DirectDepositConclusionText'));
                return await stepContext.beginDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP,ContinueAndFeedbackDialog);
            case 'No':
                return await stepContext.endDialog(this.id);
        }
    }
   /**
   * This is the users feed back promt step.
   */
    private async feedbackStep(stepContext) {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
         // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                return await stepContext.beginDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP,ContinueAndFeedbackDialog);
            case 'No':
                return await stepContext.beginDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP,ContinueAndFeedbackDialog);
        }
    }
   /**
   * This is the final step in the main waterfall dialog.
   */
    private async finalStep(stepContext) {
        await stepContext.context.sendActivity(i18n.__('DirectDepositThanksText'));
        return await stepContext.endDialog();
    }

}






