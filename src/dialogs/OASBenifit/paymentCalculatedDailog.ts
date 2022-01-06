import { LuisRecognizer } from 'botbuilder-ai';
import {
    ChoiceFactory, ComponentDialog, DialogTurnResult, ListStyle, TextPrompt,
    WaterfallDialog, WaterfallStepContext
} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../Common/continueAndFeedbackDialog';
import i18n from '../locales/i18nconfig';

const WATERFALL_DIALOG = 'waterfallDialog';
const CHOISE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

export const PAYMENT_CALCULATED_DIALOG_STEP = 'PAYMENT_CALCULATED_DIALOG_STEP';
// Define the main dialog and its related components.
export class PaymentCalculatedDailog extends ComponentDialog {

    constructor() {
        super(PAYMENT_CALCULATED_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ContinueAndFeedbackDialog())
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

        const paymentCalculatedFirstMsg = i18n.__('PaymentCalculatedText1');
        const paymentCalculatedSecondMsg = i18n.__('PaymentCalculatedText2');
        const paymentCalculatedThirdMsg = i18n.__('PaymentCalculatedText3');
        const paymentCalculatedFourthMsg = i18n.__('PaymentCalculatedText4');
        
        const promptOptions = i18n.__('PaymentChangeChoices');
        
        await stepContext.context.sendActivity(paymentCalculatedFirstMsg);
        await stepContext.context.sendActivity(paymentCalculatedSecondMsg);
        await stepContext.context.sendActivity(paymentCalculatedThirdMsg);

        return await stepContext.prompt(CHOISE_PROMPT, {
           prompt: paymentCalculatedFourthMsg,
           choices: ChoiceFactory.toChoices(promptOptions),
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
