import {
  ActivityHandler,
  BotState,
  StatePropertyAccessor
} from 'botbuilder';
import { MainDialog } from '../dialogs/mainDialog';

import { Dialog, DialogState, DialogSet } from 'botbuilder-dialogs';
export class VirtualAssistantUnblockBot extends ActivityHandler {
  private conversationState: BotState;
  private userState: BotState;
  private dialog: Dialog;
  private dialogSet: DialogSet;
  private dialogState: StatePropertyAccessor<DialogState>;

  constructor(
    conversationState: BotState,
    userState: BotState,
    dialogSet: DialogSet
  ) {
    super();

    if (!conversationState) {
      throw new Error(
        '[DialogBot]: Missing parameter. conversationState is required'
      );
    }
    if (!userState) {
      throw new Error('[DialogBot]: Missing parameter. userState is required');}
    if (!dialogSet) {
      throw new Error('[DialogBot]: Missing parameter. dialogSet is required');
    }

    // Initialise private members for the bot
    this.conversationState = conversationState;
    this.userState = userState;
    this.dialogSet = dialogSet;
    this.dialog = new MainDialog();
    this.dialogState = this.conversationState.createProperty('DialogState');
    // Add the main dialog to the dialog set for the bot
    // this.addDialogs();

    this.onEvent(async (context, next) => {
      if (context.activity.name === 'requestWelcomeDialog') {
        await context.sendActivity('Back Channel Welcome Message!');
      }

      await next();
    });

    this.onMembersAdded(async (context, next) => {
      // console.log('MEMBER ADDED:Running dialog with Message Activity.');

      // Send greeting and then activate dialog
      // await context.sendActivity(`Hi Mary, I’m your virtual concierge!`);

      // Run the Dialog with the new message Activity.
      await (this.dialog as MainDialog).run(context, this.dialogState);

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onMessage(async (context, next) => {
      // console.log('Running dialog with Message Activity.');
      // Run the Dialog with the new message Activity.
      await (this.dialog as MainDialog).run(context, this.dialogState);

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

  }

  addDialogs() {
    const mainDialog = new MainDialog();

    this.dialogSet.add(mainDialog);

  }

  /**
   * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
   */
  public async run(context) {
    await super.run(context);

    // Save any state changes. The load happened during the execution of the Dialog.
    await this.userState.saveChanges(context, false);
    await this.conversationState.saveChanges(context, false);
  }
}
