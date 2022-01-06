// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { InputHints } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle,
    PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../utils/luisAppSetup';
import i18n from '../locales/i18nconfig';
import { dateOfNextPaymentDialog, DATE_OF_NEXT_PAYMENT_DIALOG_STEP } from '../OASBenifit/dateOfNextPaymentDialog';
import { PaymentChangeDailog, PAYMENT_CHANGE_DIALOG_STEP } from '../OASBenifit/paymentChangeDailog';


const WATERFALL_DIALOG = 'waterfallDialog';
const CHOISE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

export const OAS_BENEFIT_DIALOG_STEP = 'OAS_BENEFIT_DIALOG_STEP';

// Define the main dialog and its related components.

export class oASBenifitDialog extends ComponentDialog {
    constructor() {
        super(OAS_BENEFIT_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOISE_PROMPT,this.CustomChoiceValidator))
            .addDialog(new PaymentChangeDailog())
            .addDialog(new dateOfNextPaymentDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.continueStep.bind(this),
                this.selectionStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
     /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    public async continueStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const prompt = i18n.__('oasBenifitChoicePrompt');
        let choices: Array<string>;
        choices = i18n.__('oasBenifitChoices');
        return await stepContext.prompt(CHOISE_PROMPT, {
            prompt: prompt,
            choices: ChoiceFactory.toChoices(choices),
            style: ListStyle.suggestedAction
        });
    }
   /**
   * This is the final step in the main waterfall dialog.
   * Bot promts the 'Date of Next Payment' and 'Payment amount change'
   * Users selects the one of the promts.
   */
    public async selectionStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'DateOfNextPayment':
                return await stepContext.replaceDialog(DATE_OF_NEXT_PAYMENT_DIALOG_STEP, dateOfNextPaymentDialog);
            case 'Paymentamountchange':
                    return await stepContext.replaceDialog(PAYMENT_CHANGE_DIALOG_STEP, PaymentChangeDailog);
            default:
                // Catch all for unhandled intents
                const didntUnderstandMessageText = 'Sorry i didn\'t understand that, try asking me different question';
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        return await stepContext.next();
    }
}
