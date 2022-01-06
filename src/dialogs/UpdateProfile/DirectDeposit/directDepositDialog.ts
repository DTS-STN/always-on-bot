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
import { LUISAOSetup } from '../../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../../Common/continueAndFeedbackDialog';
import i18n from '../../locales/i18nconfig';
import { ConfirmExitDirectDepositChequePromptDialog } from './confirmExitDirectDepositAccountDialog';
import { DirectDepositAccountIntegrationDialog, DIRECT_DEPOSIT_ACCOUNT_INTEGRATION_DIALOG_STEP } from './directDepositAccountIntegrationDialog';

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

export const DIRECT_DEPOSIT_DIALOG_STEP = 'DIRECT_DEPOSIT_DIALOG_STEP';

export class DirectDepositDialog extends ComponentDialog {
    constructor() {
        super(DIRECT_DEPOSIT_DIALOG_STEP);

        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            //.addDialog(new directDepositAccountDialog())
            .addDialog(new ConfirmExitDirectDepositChequePromptDialog())
            .addDialog(new DirectDepositAccountIntegrationDialog())
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.accountConfirmStep.bind(this),
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
    private async accountConfirmStep(stepContext: WaterfallStepContext) {
        let promptOptions: Array<string>;
        let promptMsg=i18n.__('DirectDepositAccountCheck')
        promptOptions = i18n.__('continueAndFeedChoices');
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptMsg,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.suggestedAction
        });
    }
     /**
     * This is the final step in the main waterfall dialog.
     */
    private async finalStep(stepContext: WaterfallStepContext) {
        
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
         // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                return await stepContext.beginDialog(DIRECT_DEPOSIT_ACCOUNT_INTEGRATION_DIALOG_STEP,DirectDepositAccountIntegrationDialog);
            case 'No':
                await stepContext.context.sendActivity(i18n.__('DirectDepositNoAccountText'));
                await stepContext.context.sendActivity(i18n.__('DirectDepositOldAgePrompt'));
                return await stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP,ContinueAndFeedbackDialog);
        }
    }

    
}






