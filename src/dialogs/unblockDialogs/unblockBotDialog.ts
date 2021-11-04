import { ComponentDialog, WaterfallDialog } from 'botbuilder-dialogs';
import {
  ConfirmLookIntoStep,
  CONFIRM_LOOK_INTO_STEP,
} from './confirmLookIntoStep';
import {
  ConfirmHomeAddressStep,
  CONFIRM_HOME_ADDRESS_STEP,
} from './confirmHomeAddressStep';
import i18n from '../locales/i18nConfig';
import { CallbackBotDialog } from '../callbackBotDialog';

export const UNBLOCK_BOT_DIALOG = 'UNBLOCK_BOT_DIALOG';
const MAIN_UNBLOCK_BOT_WATERFALL_DIALOG = 'MAIN_UNBLOCK_BOT_WATERFALL_DIALOG';

export class UnblockBotDialog extends ComponentDialog {
  constructor() {
    super(UNBLOCK_BOT_DIALOG);

    // Add the ConfirmLookIntoStep dialog to the dialog stack
    this.addDialog(new ConfirmLookIntoStep());
    this.addDialog(new ConfirmHomeAddressStep());
    this.addDialog(new CallbackBotDialog());

    this.addDialog(
      new WaterfallDialog(MAIN_UNBLOCK_BOT_WATERFALL_DIALOG, [
        this.welcomeStep.bind(this),
        this.confirmLookIntoStep.bind(this),
        this.confirmHomeAddressStep.bind(this),
        this.finalStep.bind(this),
      ]),
    );

    this.initialDialogId = MAIN_UNBLOCK_BOT_WATERFALL_DIALOG;
  }

  /**
   * 1. Initial step in the waterfall. This will kick of the unblockbot dialog
   * Most of the time this will just kick off the CONFIRM_LOOK_INTO_STEP dialog -
   * But in the off chance that the bot has already run through the switch statement
   * will take care of edge cases
   */
  async welcomeStep(stepContext) {
    // Get the unblockbot details / state machine for the current user
    const unblockBotDetails = stepContext.options;

    // DEBUG
    // console.log('DEBUG: welcomeSteps:', unblockBotDetails);

    const welcomeMsg = i18n.__('unBlockBotDialogWelcomeMsg');
    await stepContext.context.sendActivity(welcomeMsg);
    return await stepContext.next(unblockBotDetails);
  }

  /**
   * 2. Confirm the user's intent to proceed with the unblockbot
   */
  async confirmLookIntoStep(stepContext) {
    // Get the state machine from the last step
    const unblockBotDetails = stepContext.result;

    // DEBUG
    // console.log('DEBUG: confirmLookIntoStep:', unblockBotDetails);
    console.log('confirmLookIntoStep', unblockBotDetails.confirmLookIntoStep);
    switch (unblockBotDetails.confirmLookIntoStep) {
      // The confirmLookIntoStep flag in the state machine isn't set
      // so we are sending the user to that step
      case null:
        return await stepContext.beginDialog(
          CONFIRM_LOOK_INTO_STEP,
          unblockBotDetails,
        );

      // The confirmLookIntoStep flag in the state machine is set to true
      // so we are sending the user to next step
      case true:
        return await stepContext.next(unblockBotDetails);

      // The confirmLookIntoStep flag in the state machine is set to false
      // so we are sending to the end because they don't want to continue
      case false:
        return await stepContext.endDialog(unblockBotDetails);

      // Default catch all but we should never get here
      default:
        return await stepContext.endDialog(unblockBotDetails);
    }
  }

  /**
  * 3. Confirm the user's home address
  */
  async confirmHomeAddressStep(stepContext) {
  // Get the state machine from the last step
  const unblockBotDetails = stepContext.result;

  // DEBUG
  // console.log('DEBUG: confirmHomeAddressStep:', unblockBotDetails);

  // Check if a master error occured and then end the dialog
  if (unblockBotDetails.masterError) {
    return await stepContext.endDialog(unblockBotDetails);
  } else {
    // If no master error occured continue on to the next step
    switch (unblockBotDetails.confirmHomeAddressStep) {
      // The confirmLookIntoStep flag in the state machine isn't set
      // so we are sending the user to that step
      case null:
        return await stepContext.beginDialog(
          CONFIRM_HOME_ADDRESS_STEP,
          unblockBotDetails,
        );

      // The confirmLookIntoStep flag in the state machine is set to true
      // so we are sending the user to next step
      case true:
        return await stepContext.next();

      // The confirmLookIntoStep flag in the state machine is set to false
      // so we are sending to the end because they don't want to continue
      case false:
      default:
        return await stepContext.endDialog(unblockBotDetails);
      }
    }
  }

  /**
   * Final step in the waterfall. This will end the unblockbot dialog
   */
  async finalStep(stepContext) {
    // Get the results of the last ran step
    const unblockBotDetails = stepContext.result;

    // DEBUG
    console.log('DEBUG finalStep: ', unblockBotDetails);

    // Check if a master error has occured
    if (unblockBotDetails.masterError) {
      const masterErrorMsg = i18n.__('masterErrorMsg');
      await stepContext.context.sendActivity(masterErrorMsg);
    }

    return await stepContext.endDialog(unblockBotDetails);
  }
}
