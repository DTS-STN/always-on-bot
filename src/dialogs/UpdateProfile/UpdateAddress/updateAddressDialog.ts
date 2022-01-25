
import { Choice, ChoicePrompt, ComponentDialog, ConfirmPrompt, DialogTurnResult, PromptValidatorContext, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../models/commonPromptValidatorModel';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../../Common/continueAndFeedbackDialog';
import { FeedbackDialog, FeedBack_Dialog } from '../../Common/FeedbackDialog';
import { COMMON_CHOICE_CHECK_DIALOG } from '../UpdatePhoneNumber/commonChoiceCheckDialog';
import { AddressDetails } from './addressDetails';
import { GetAddressesDialog, GET_ADDRESS_DIALOG_STEP } from './getAddressesDialog';

const WATERFALL_DIALOG = 'waterfallDialog';
const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
let runcount:number;
export const UPDATE_ADDRESS_DIALOG_STEP = 'UPDATE_ADDRESS_DIALOG_STEP';
// Define the main dialog and its related components.
export class UpdateAddressDialog extends ComponentDialog {
    constructor() {
        super(UPDATE_ADDRESS_DIALOG_STEP);
        
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new GetAddressesDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.checkAddressStep.bind(this),
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
    async checkAddressStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {

        let commonPromptValidatorModel = new CommonPromptValidatorModel(
            ["Yes", "No"],
            4,
            'UpdateAddress'
        );
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_DIALOG, commonPromptValidatorModel);
    }
    /**
    * Selection step in the waterfall.
    * Bot displays the addresses to the user based on postal code entered by the user.
    */

     async selectionStep(stepContext) {
        const addressDetails = new AddressDetails;
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status) {
            switch (commonPromptValidatorModel.result) {
                case 'Yes':
                    return await stepContext.replaceDialog(GET_ADDRESS_DIALOG_STEP, addressDetails);
                case 'No':
                    return await stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP, ContinueAndFeedbackDialog);
                
            }
        }
        else {
            return stepContext.beginDialog(FeedBack_Dialog, FeedbackDialog);
        }
    } 
}

