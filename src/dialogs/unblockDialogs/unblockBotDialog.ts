import { ComponentDialog, WaterfallDialog } from 'botbuilder-dialogs';
import {
  ConfirmLookIntoStep,
  CONFIRM_LOOK_INTO_STEP
} from './unblockLookup';

import {
  UnblockDirectDepositStep,
  CONFIRM_DIRECT_DEPOSIT_STEP
} from './unblockDirectDeposit';

import i18n from '../locales/i18nConfig';
import { CallbackBotDialog } from '../callbackBotDialog';
import { TextBlock, addACard, adaptiveCard } from '../../cards';

export const UNBLOCK_BOT_DIALOG = 'UNBLOCK_BOT_DIALOG';
const MAIN_UNBLOCK_BOT_WATERFALL_DIALOG = 'MAIN_UNBLOCK_BOT_WATERFALL_DIALOG';

export class UnblockBotDialog extends ComponentDialog {
  constructor() {
    super(UNBLOCK_BOT_DIALOG);

    // Add the ConfirmLookIntoStep dialog to the dialog stack
    this.addDialog(new ConfirmLookIntoStep());
    this.addDialog(new UnblockDirectDepositStep());
    this.addDialog(new CallbackBotDialog());

    this.addDialog(
      new WaterfallDialog(MAIN_UNBLOCK_BOT_WATERFALL_DIALOG, [
        this.welcomeStep.bind(this),
        this.confirmLookIntoStep.bind(this),
        this.unblockDirectDepositStep.bind(this),
        this.finalStep.bind(this)
      ])
    );

    this.initialDialogId = MAIN_UNBLOCK_BOT_WATERFALL_DIALOG;
  }

  /**
   * 1. Initial step in the waterfall. This will kick of the unblockbot dialog
   * Most of the time this will just kick off the CONFIRM_LOOK_INTO_STEP dialog -
   * But in the off chance that the bot has already run through the switch statement
   * will take care of edge cases
   */
  async welcomeStep(stepContext:any) {
    // Get the unblockbot details / state machine for the current user
    const unblockBotDetails = stepContext.options;

    // DEBUG
    // console.log('DEBUG: welcomeSteps:', unblockBotDetails);
    await adaptiveCard(stepContext, TextBlock(i18n.__('unblockLookup_welcome_msg')));
    return await stepContext.next(unblockBotDetails);
  }

  /**
   * 2. Confirm the user's intent to proceed with the unblockbot
   */
  async confirmLookIntoStep(stepContext:any) {
    // Get the state machine from the last step
    const unblockBotDetails = stepContext.result;

    // DEBUG
    // console.log('UNBLOCK LOOKUP:', unblockBotDetails);

    switch (unblockBotDetails.confirmLookIntoStep) {
      // The confirmLookIntoStep flag in the state machine isn't set
      // so we are sending the user to that step
      case null:
        return await stepContext.beginDialog(
          CONFIRM_LOOK_INTO_STEP,
          unblockBotDetails
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

  // Unblock the user's direct deposit account
  async unblockDirectDepositStep(stepContext) {

    // Get the state machine from the last step
  const unblockBotDetails = stepContext.result;

  // DEBUG
  // console.log('DIRECT DEPOSIT STEP:', unblockBotDetails);

  // Check if a master error occured and then end the dialog
  if (unblockBotDetails.masterError) {
    return await stepContext.endDialog(unblockBotDetails);
  } else {
    // If no master error occured continue on to the next step
    switch (unblockBotDetails.unblockDirectDeposit) {
      // The confirmLookIntoStep flag in the state machine isn't set
      // so we are sending the user to that step
      case null:
        return await stepContext.beginDialog(
          CONFIRM_DIRECT_DEPOSIT_STEP,
          unblockBotDetails
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
    // console.log('UNBLOCK FINALSTEP: ', unblockBotDetails);

    // Check if a master error has occured
    if (unblockBotDetails.masterError) {
      const masterErrorMsg = i18n.__('masterErrorMsg');
      await stepContext.context.sendActivity(masterErrorMsg);
    }

    return await stepContext.endDialog(unblockBotDetails);
  }
}
