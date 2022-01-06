// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { InputHints } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory,
    ChoicePrompt, ComponentDialog,
    ConfirmPrompt, ListStyle,
    PromptValidatorContext, TextPrompt,
    WaterfallDialog
} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog } from '../Common/continueAndFeedbackDialog';
import i18n from '../locales/i18nconfig';
import { DirectDepositDetails } from './DirectDeposit/directDepositDetails';
import { DirectDepositDialog, DIRECT_DEPOSIT_DIALOG_STEP } from './DirectDeposit/directDepositDialog';
import { UpdateAddressDialog, UPDATE_ADDRESS_DIALOG_STEP } from './UpdateAddress/updateAddressDialog';

const CONFIRM_PROMPT = 'confirmPrompt';
const continue_And_Feedback_Dialog = 'ContinueAndFeedbackDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

export const UPDATE_PROFILE_DIALOG_STEP = 'UPDATE_PROFILE_DIALOG_STEP';
// Define the main dialog and its related components.
export class UpdateProfileDialog extends ComponentDialog {
    constructor() {
        super(UPDATE_PROFILE_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new DirectDepositDialog())
            .addDialog(new UpdateAddressDialog())
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.checkProfileStep.bind(this),
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
    async checkProfileStep(stepContext) {
        let promptMsg = i18n.__('UpdatemyprofilePrompt');
        let promptOptions: Array<string>;
        promptOptions = i18n.__('UpdatemyprofileChoices');
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptMsg,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.suggestedAction
        });
    }
    /**
    * Selection step in the waterfall.
    * Bot chooses the flows(UpdateMyAddress,UpdateDirectDeposit) based on user's input.
    */
    async routingStep(stepContext) {
        const recognizer = LUISAOSetup(stepContext);
        const directDepositdetails = new DirectDepositDetails();
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'UpdateMyAddress':
                return await stepContext.replaceDialog(UPDATE_ADDRESS_DIALOG_STEP, null);
            case 'UpdatePowerofAttorney':
                return await stepContext.endDialog(this.id);
            case 'UpdateDirectDeposit':
                return await stepContext.replaceDialog(DIRECT_DEPOSIT_DIALOG_STEP, directDepositdetails);
            default:
                // Catch all for unhandled intents
                const didntUnderstandMessageText = 'Sorry i didn\'t understand that, try asking me different question';
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        return await stepContext.next();
    }
}
