
import { LuisRecognizer } from 'botbuilder-ai';
import {
    ChoiceFactory,
    ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle, TextPrompt,
    WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog } from '../../Common/continueAndFeedbackDialog';
import i18n from '../../locales/i18nconfig';
import { AddressDetails } from './addressDetails';
import { UpdateAddressDialog, UPDATE_ADDRESS_DIALOG_STEP } from './updateAddressDialog';

const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

export const ADDRESS_NOT_LISTED_DAILOG_STEP = 'ADDRESS_NOT_LISTED_DAILOG_STEP';

// Define the main dialog and its related components.
export class AddressNotListedDialog extends ComponentDialog {
    constructor() {
        super(ADDRESS_NOT_LISTED_DAILOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.retryAddressCheckStep.bind(this),
                this.confirmretryAddressCheckStep.bind(this),
                this.checkProfileStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * bot allows the user to re-enter the postal code if it is incorrect
     */

    private async retryAddressCheckStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode=stepContext.options as AddressDetails;
        let promptmsg = this.GetEditedResponse(i18n.__('RetryAddressCheckResponse'),postalCode.PostalCode);
        let promptOptions: Array<string>;
        promptOptions = i18n.__('updateAddressConfirmAddressChoices');
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptmsg,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.suggestedAction
        });
    }

    /**
    * Confirm Retry address check step in the waterfall.
    * user selects the 'Yes' prompt to confirm the entered postal code.
    */
    private async confirmretryAddressCheckStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode=stepContext.options as AddressDetails;
        let promptmsg = this.GetEditedResponse(i18n.__('ConcludeAddressNotFound'),postalCode.PostalCode);
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                let promptOptions: Array<string>;
                promptOptions = i18n.__('updateAddressConfirmAddressChoices');
                return await stepContext.prompt(CHOICE_PROMPT, {
                    prompt: promptmsg,
                    choices: ChoiceFactory.toChoices(promptOptions),
                    style: ListStyle.suggestedAction
                });
            case 'No':
                return await stepContext.beginDialog(UPDATE_ADDRESS_DIALOG_STEP, null);
            default:
                await stepContext.context.sendActivity(i18n.__('DidntUnderstandMessageText'));
                return await stepContext.endDialog();
        }
    }
    /**
    * Check profile step in the waterfall.
    */
    private async checkProfileStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                return await stepContext.endDialog(this.id);
            case 'No':
                return await stepContext.beginDialog(UPDATE_ADDRESS_DIALOG_STEP, UpdateAddressDialog);
            default:
                await stepContext.context.sendActivity(i18n.__('DidntUnderstandMessageText'));
                return await stepContext.endDialog(this.id);
        }
    }
    private GetEditedResponse(response:string,postalCode:string)
    {
        response=response.replace("@Postal_Code",postalCode)
        return response;
    }
}