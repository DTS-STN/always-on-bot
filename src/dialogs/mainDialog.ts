import {
  ComponentDialog,
  ChoiceFactory,
  ChoicePrompt,
  DialogSet,
  DialogTurnStatus,
  WaterfallDialog,
  DialogTurnResult,
  WaterfallStepContext,
  DialogState,
} from 'botbuilder-dialogs';

import { TurnContext, StatePropertyAccessor, UserState } from 'botbuilder';

import i18n from './locales/i18nConfig';
import { UnblockBotDetails } from './unblockDialogs/unblockBotDetails';
import {
  UNBLOCK_BOT_DIALOG,
  UnblockBotDialog,
} from './unblockDialogs/unblockBotDialog';

const CHOICE_PROMPT = 'CHOICE_PROMPT';

// The String ID name for the main dialog
const MAIN_DIALOG = 'MAIN_DIALOG';

// The String ID of the waterfall dialog that exists in the main dialog
const MAIN_WATERFALL_DIALOG = 'MAIN_WATERFALL_DIALOG';

export class MainDialog extends ComponentDialog {
  constructor() {
    super(MAIN_DIALOG);

    // Add the unblockBot dialog to the dialog
    this.addDialog(new UnblockBotDialog());
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

    this.addDialog(
      new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
        this.initialStep.bind(this),
        this.rateStep.bind(this),
        this.finalStep.bind(this),
      ]),
    );

    this.initialDialogId = MAIN_WATERFALL_DIALOG;
  }

  /**
   * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
   * If no dialog is active, it will start the default dialog.
   * @param {*} turnContext
   * @param {*} accessor
   */
  public async run(
    turnContext: TurnContext,
    accessor: StatePropertyAccessor<DialogState>,
  ) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }

  /**
   * Initial step in the waterfall. This will kick of the callbackBot dialog
   */
  async initialStep(
    stepContext: WaterfallStepContext,
  ): Promise<DialogTurnResult> {
    // Here we are start the unblock dialog in the prototype,
    // in the real case, the callback flow will trigger from unblock bot, which
    // should run in a different instance
    const unblockBotDetails = new UnblockBotDetails();
    return await stepContext.beginDialog(UNBLOCK_BOT_DIALOG, unblockBotDetails);
  }

  /**
   * Rate step in the waterfall.
   * ask users to review the user experience for future improvement
   */
  async rateStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
    const feedbackMsg = i18n.__('mainDialogFeedbackMsg');

    // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
    return await stepContext.prompt(CHOICE_PROMPT, {
      prompt: feedbackMsg,
      choices: ChoiceFactory.toChoices(['😡', '🙁', '😐', '🙂', '😄']),
    });
  }

  /**
   * This is the final step in the main waterfall dialog.
   */
  async finalStep(
    stepContext: WaterfallStepContext,
  ): Promise<DialogTurnResult> {
    const greatDayMsg = i18n.__('mainDialogGreatDayMsg');

    await stepContext.context.sendActivity(greatDayMsg);
    // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
    return await stepContext.endDialog();
  }
}
