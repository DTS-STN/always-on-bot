
import { InputHints } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import {
    ChoiceFactory,
    ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle, TextPrompt,
    WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../../Common/continueAndFeedbackDialog';
import i18n from '../../locales/i18nconfig';
import { AddressDetails } from './addressDetails';
import { ADDRESS_NOT_LISTED_DAILOG_STEP } from './addressNotListedDailog';


const WATERFALL_DIALOG = 'waterfallDialog';
const CHOISE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

export const CONFIRM_ADDRESS_DIALOG_STEP = 'CONFIRM_ADDRESS_DIALOG_STEP';

// Define the main dialog and its related components.
export class ConfirmAddressDailog extends ComponentDialog {
    constructor() {
        super(CONFIRM_ADDRESS_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOISE_PROMPT))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.continueStep.bind(this),
                this.selectionStep.bind(this)
               
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async continueStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode=stepContext.options as AddressDetails;
        let promptmsg = this.GetEditedResponse(i18n.__('updateAddressConfirmAddressPrompt'),postalCode.PostalCode);
        return await stepContext.prompt(CHOISE_PROMPT, {
            prompt: promptmsg,
            choices: ChoiceFactory.toChoices(i18n.__('updateAddressConfirmAddressChoices')),
            style: ListStyle.suggestedAction
        });
    }
    /**
    * User selection step in the waterfall.
    * User selects the 'Yes' prompt to navigate to the users's feed back flow.
    * User selects the 'No' prompt to navigate to Address not listed flow.
    */
    async selectionStep(stepContext:WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode=stepContext.options as AddressDetails;
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                return await stepContext.beginDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP, ContinueAndFeedbackDialog);
            case 'No':
                return await stepContext.beginDialog(ADDRESS_NOT_LISTED_DAILOG_STEP, postalCode);
            default:
                // Catch all for unhandled intents
                const didntUnderstandMessageText = 'Sorry i didn\'t understand that, try asking me different question';
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
                return await stepContext.endDialog(this.id);
        }
    }
    private GetEditedResponse(response:string,postalCode:string)
    {
        response=response.replace("@Postal_Code",postalCode)
        return response;
    }

}