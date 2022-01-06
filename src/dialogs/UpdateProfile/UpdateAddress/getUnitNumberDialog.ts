
import { InputHints } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory,
    ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle, PromptValidatorContext, TextPrompt,
    WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../../Common/continueAndFeedbackDialog';
import i18n from '../../locales/i18nconfig';
import { AddressDetails } from './addressDetails';
import { AddressNotListedDialog, ADDRESS_NOT_LISTED_DAILOG_STEP } from './addressNotListedDailog';
import { ConfirmAddressDailog } from './confirmAddressDailog';
import { GetAddressesDialog, GET_ADDRESS_DIALOG_STEP } from './getAddressesDialog';
import { UnitAdreessNotListedDialog, UNIT_ADDRESS_NOT_LISTED_DIALOG_STEP } from './UnitAddressNotListedDialog';


const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

export const GET_UNITNUMBER_DAILOG_STEP = 'GET_UNITNUMBER_DAILOG_STEP';

// Define the main dialog and its related components.
export class GetUnitNumberDialog extends ComponentDialog {
    constructor() {
        super(GET_UNITNUMBER_DAILOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT,this.CustomChoiceValidator))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new ConfirmAddressDailog())
            .addDialog(new AddressNotListedDialog())
            .addDialog(new UnitAdreessNotListedDialog())
            .addDialog(new GetAddressesDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.continueStep.bind(this),
                this.selectionStep.bind(this),
                this.selectUnitNumberResultStep.bind(this),
                this.confirmUnitNumberResultStep.bind(this)

            ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }
    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
     /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * 
     */
    async continueStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const postalCode=stepContext.options as AddressDetails;
        let promptmsg = this.GetEditedResponse(i18n.__('updateAddressStreetNumberPrompt'),postalCode.PostalCode);
        return await stepContext.prompt(TEXT_PROMPT, promptmsg)
    }

    /**
    * selectionStep in the waterfall.
    * when user enter the street number then it displays the corresponding address to the user.
    */
    async selectionStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult>{
        const postalCode=stepContext.options as AddressDetails;
        switch (stepContext.context.activity.text) {
            case '300':
                // Match Found case
                return await stepContext.replaceDialog('confirmAddressDailog', postalCode);
            case '517':
                let promptmsg = this.GetEditedResponse(i18n.__('updateAddressUnitNumberPrompt'),postalCode.PostalCode);
                let promptchoice=i18n.__('unitAppartmentNumberChoice');
                return await stepContext.prompt(CHOICE_PROMPT, {
                    prompt: promptmsg,
                    choices: ChoiceFactory.toChoices([promptchoice]),
                    style: ListStyle.suggestedAction
                });
            default:
                // Catch all for unhandled intents
                const didntUnderstandMessageText = i18n.__('DidntUnderstandMessageText');
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
                return await stepContext.endDialog(this.id);
        }
    }
    /**
    * Select Unit Number in the waterfall.
    * when user enter the Unit Number & Street number then it displays the corresponding address to the user.
    */
    async selectUnitNumberResultStep(stepContext:WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult>{
        const postalCode=stepContext.options as AddressDetails;
        if(stepContext.context.activity.text=='I don\'t have a unit or apprtment number') 
        {
            return await stepContext.replaceDialog(UNIT_ADDRESS_NOT_LISTED_DIALOG_STEP,postalCode );
        }
        else if(stepContext.context.activity.text=='1207')
        {
            postalCode.UnitNumber='1207';
            const choices = i18n.__('continueAndFeedChoices');
            let promptmsg = this.GetEditedResponse(i18n.__('AddressFoundCheck'),postalCode);
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt: promptmsg,
                choices: ChoiceFactory.toChoices(choices),
                style: ListStyle.suggestedAction
            }); 
        }
        else {
            postalCode.UnitNumber=stepContext.context.activity.text;
            return await stepContext.replaceDialog(GET_ADDRESS_DIALOG_STEP, postalCode);
        }
        
    }
    /**
    * This is the final step in the waterfall.
    * User selects the 'Yes' prompt to navigate to the users's feed back flow.
    * User selects the 'No' prompt to navigate to Address not listed flow.
    */
    async confirmUnitNumberResultStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult>{
        const postalCode=stepContext.options as AddressDetails;
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'No':
               return await stepContext.replaceDialog(ADDRESS_NOT_LISTED_DAILOG_STEP,postalCode);
            case 'Yes':
                return await stepContext.beginDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP, null);
            default:
                // Catch all for unhandled intents
                const didntUnderstandMessageText = 'Soory i didn\'t understand that, try asking me different question';
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
                return await stepContext.endDialog(this.id);
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
            response=response.replace("#Unit_Number,","");
        }
        
        return response;
    }

}