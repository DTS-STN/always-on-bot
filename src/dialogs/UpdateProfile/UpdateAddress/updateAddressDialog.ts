
import { InputHints } from 'botbuilder';
import {
    Choice, ChoicePrompt, ComponentDialog, ConfirmPrompt, DialogTurnResult, PromptValidatorContext, WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { ContinueAndFeedbackDialog } from '../../Common/continueAndFeedbackDialog';
import i18n from '../../locales/i18nconfig';
import { AddressDetails } from './addressDetails';
import { GetAddressesDialog, GET_ADDRESS_DIALOG_STEP } from './getAddressesDialog';
import { GetUnitNumberDialog, GET_UNITNUMBER_DAILOG_STEP } from './getUnitNumberDialog';


const WATERFALL_DIALOG = 'waterfallDialog';
const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

export const UPDATE_ADDRESS_DIALOG_STEP = 'UPDATE_ADDRESS_DIALOG_STEP';
// Define the main dialog and its related components.
export class UpdateAddressDialog extends ComponentDialog {
    constructor() {
        super(UPDATE_ADDRESS_DIALOG_STEP);

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new GetAddressesDialog())
            .addDialog(new GetUnitNumberDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.continueStep.bind(this),
                this.selectionStep.bind(this),
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async continueStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        return await stepContext.prompt(TEXT_PROMPT, i18n.__('updateAddressPostalCodePrompt'));
        // use this when dialog is called not called for the first time
        //return await stepContext.prompt(TEXT_PROMPT, i18n.__('ServiceRetryPostalCode'));
    }
    /**
    * Selection step in the waterfall.
    * Bot displays the addresses to the user based on postal code entered by the user.
    */
    async selectionStep(stepContext) {
        const postalCode=new AddressDetails;
        switch (stepContext.context.activity.text) {
            case 'M4P 3C5':
                postalCode.PostalCode='M4P 3C5';
                return await stepContext.replaceDialog(GET_ADDRESS_DIALOG_STEP, postalCode);
            case 'M1P 4P5':
                postalCode.PostalCode='M1P 4P5';
                return await stepContext.replaceDialog(GET_UNITNUMBER_DAILOG_STEP, postalCode);
            default:
                const didntUnderstandMessageText = 'Sorry i didn\'t understand that, try asking me different question';
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
            response=response.replace("#Unit_Number","");
        }
        
        return response;
    }
}

