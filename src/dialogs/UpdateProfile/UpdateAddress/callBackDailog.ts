
import {
    Choice,
    ChoicePrompt, ComponentDialog, DialogTurnResult, PromptValidatorContext, TextPrompt, WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../models/commonPromptValidatorModel';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../../Common/continueAndFeedbackDialog';
import { FeedbackDialog, FeedBack_Dialog } from '../../Common/FeedbackDialog';
import { COMMON_CHOICE_CHECK_DIALOG } from '../UpdatePhoneNumber/commonChoiceCheckDialog';

const WATERFALL_DIALOG = 'waterfallDialog';
const CHOISE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

export const CALL_BACK_DAILOG_STEP = 'Call_BACK_DAILOG';

// Define the main dialog and its related components.
export class CallBackDailog extends ComponentDialog {
    constructor() {
        super(CALL_BACK_DAILOG_STEP);

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
     private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async continueStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {

        let commonPromptValidatorModel = new CommonPromptValidatorModel(
            ["YesIWantToRequestCall", "NoNotForNow"],
            3,
            'ServiceRepresentative'
        );
        //call dialog
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_DIALOG, commonPromptValidatorModel);
    }
    /**
    * User selection step in the waterfall.
    * User selects the 'Yes' prompt to navigate to the users's feed back flow.
    * User selects the 'No' prompt to navigate to Address not listed flow.
    */

     private async selectionStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;

        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status)
        {
            switch (commonPromptValidatorModel.result) {
                case 'YesIWantToRequestCall':
                    return await stepContext.endDialog(this.id);
                case 'NoNotForNow':
                    return await stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP, ContinueAndFeedbackDialog);
            }
        }
        else
        {
            return stepContext.beginDialog(FeedBack_Dialog, FeedbackDialog);
            return await stepContext.endDialog();
        }
    }
}