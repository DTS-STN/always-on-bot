
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
import { UPDATE_ADDRESS_DIALOG_STEP } from './updateAddressDialog';

const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

export const UNIT_ADDRESS_NOT_LISTED_DIALOG_STEP = 'UNIT_ADDRESS_NOT_LISTED_DIALOG_STEP';
// Define the main dialog and its related components.
export class UnitAdreessNotListedDialog extends ComponentDialog {
    constructor() {
        super(UNIT_ADDRESS_NOT_LISTED_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.InitialStep.bind(this),
                this.ChoiceStep.bind(this),
                this.FinalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    private async InitialStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode=stepContext.options as AddressDetails;
        let promptmsg = this.GetEditedResponse(i18n.__('unitAdreessNotListedText'),postalCode.PostalCode);
        let selectedAddress = stepContext.result;
        let promptOptions: Array<string>;
        promptOptions = i18n.__('continueAndFeedChoices');
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptmsg,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.suggestedAction
        });
    }
    /**
    * Choice Step in the waterfall.
    * When user selects the 'Yes' prompt then bot promts the 'Yes' or 'No' with Address not found message
    * If user selects the 'No' prompt then bot will navigate to the update address flow
    */
    private async ChoiceStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode=stepContext.options as AddressDetails;
        let promptmsg = this.GetEditedResponse(i18n.__('ConcludeAddressNotFound'),postalCode.PostalCode);
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
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
                return await stepContext.replaceDialog(UPDATE_ADDRESS_DIALOG_STEP, null);
            default:
                await stepContext.context.sendActivity(i18n.__('DidntUnderstandMessageText'));
                return await stepContext.endDialog();
        }
    }

    /**
    * This is the final step in the waterfall.
    * User selects the 'Yes' prompt then it ends the flow
    * User selects the 'No' prompt to navigate to Update Address flow.
    */
    private async FinalStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                return await stepContext.endDialog(this.id);
            case 'No':
                return await stepContext.replaceDialog(UPDATE_ADDRESS_DIALOG_STEP, null);
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