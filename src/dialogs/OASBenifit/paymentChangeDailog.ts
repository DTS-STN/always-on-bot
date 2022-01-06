
import { LuisRecognizer } from 'botbuilder-ai';
import {
    ChoiceFactory,
    ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle, TextPrompt,
    WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../Common/continueAndFeedbackDialog';
import i18n from '../locales/i18nconfig';
import { PaymentCalculatedDailog, PAYMENT_CALCULATED_DIALOG_STEP } from '../OASBenifit/paymentCalculatedDailog';




const WATERFALL_DIALOG = 'waterfallDialog';
const CHOISE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

export const PAYMENT_CHANGE_DIALOG_STEP = 'PAYMENT_CHANGE_DIALOG_STEP';
// Define the main dialog and its related components.
export class PaymentChangeDailog extends ComponentDialog {
    constructor() {
        super(PAYMENT_CHANGE_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOISE_PROMPT))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new PaymentCalculatedDailog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.continueStep.bind(this),
                this.selectionStep.bind(this)
               
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
     /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Bot promts the 'How was payment calculated', 'Help from a humun' and 'No further questions'
     */
    async continueStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {

        await stepContext.context.sendActivity(i18n.__('PaymentChangeText1'));
        await stepContext.context.sendActivity(i18n.__('PaymentChangeText2'));
        return await stepContext.prompt(CHOISE_PROMPT, {
            prompt: i18n.__('PaymentChangeText3'),
            choices: ChoiceFactory.toChoices(i18n.__('PaymentChangeChoices')),
            style: ListStyle.suggestedAction
        });
    }
   /**
   * This is the final step(User's selection) in the main waterfall dialog.
   * Users selects the one of the promts.
   */
    async selectionStep(stepContext) {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
         // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Howwaspaymentcalculated':
                return await stepContext.replaceDialog(PAYMENT_CALCULATED_DIALOG_STEP, null);
            case 'Nofurtherquestions':
                await stepContext.context.sendActivity(i18n.__('NoFurtherQuestionsText'));
                return await stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP, ContinueAndFeedbackDialog);
            default:
                    return await stepContext.endDialog(this.id);
        }
        
    }

}