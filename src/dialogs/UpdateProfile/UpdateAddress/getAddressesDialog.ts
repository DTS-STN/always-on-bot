
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
import { AddressNotListedDialog, ADDRESS_NOT_LISTED_DAILOG_STEP } from './addressNotListedDailog';

const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

export const GET_ADDRESS_DIALOG_STEP = 'GET_ADDRESS_DIALOG_STEP';
// Define the main dialog and its related components.
export class GetAddressesDialog extends ComponentDialog {
    constructor() {
        super(GET_ADDRESS_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new AddressNotListedDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.continueStep.bind(this),
                this.checkSelectedAddressStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async continueStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode = stepContext.options as AddressDetails;
        let promptmsg = this.GetEditedResponse(i18n.__('updateAddressMinPrompt'), postalCode);
        let promptOptions:Array<string>;
        promptOptions = this.GetEditedChoices(i18n.__('updateAddressMinChoices'),postalCode.PostalCode);
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptmsg,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.heroCard
        });
    }
    /**
    * check selected address step in the waterfall.
    * when user selects the 'address not listed' prompt then bot asks the user to confirm postal code or re-choose the new address by entering the postal code.
    */
    private async checkSelectedAddressStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode = stepContext.options as AddressDetails;
        if (stepContext.result.value == 'My Address isn\'t listed' || stepContext.result.value == 'Mon adresse n\'est pas dans la liste') {
            return await stepContext.replaceDialog(ADDRESS_NOT_LISTED_DAILOG_STEP, postalCode);
        }
        else {
            const postalCode = stepContext.options as AddressDetails;
            let promptmsg = this.GetEditedResponse(i18n.__('AddressFoundCheck'), postalCode);
            let promptOptions: Array<string>;
            promptOptions = i18n.__('continueAndFeedChoices');
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt: promptmsg,
                choices: ChoiceFactory.toChoices(promptOptions),
                style: ListStyle.suggestedAction
            });
        }
    }
    /**
    * This is the final step in the waterfall.
    * User selects the 'Yes' prompt to navigate to the users's feed back flow.
    * User selects the 'No' prompt to navigate to Address not listed flow.
    */
    private async finalStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode = stepContext.options as AddressDetails;
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                return await stepContext.beginDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP, ContinueAndFeedbackDialog);
            case 'No':
                return await stepContext.beginDialog(ADDRESS_NOT_LISTED_DAILOG_STEP, postalCode);
        }
    }
    private GetEditedResponse(response:string,postalCode:AddressDetails)
    {
        if(postalCode.PostalCode!=null)
        {
        response=response.replace("@Postal_Code",postalCode.PostalCode);
        }
        else
        {
            response=response.replace("@Postal_Code","");
        }
        if(postalCode.UnitNumber!=null)
        {
            response=response.replace("#Unit_Number","#"+postalCode.UnitNumber);
        }
        else
        {
            response=response.replace("#Unit_Number","");
        }
        
        return response;
    }
    private GetEditedChoices(response: string[], postalCode: string) {
        let finaloptions=new Array();
        response.forEach(element=>{
            element=element.replace('@Postal_Code',postalCode)
            finaloptions.push(element)
        })
        return finaloptions;
    }
}