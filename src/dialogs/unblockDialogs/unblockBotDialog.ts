import { ComponentDialog, WaterfallDialog } from 'botbuilder-dialogs';
import { ConfirmLookIntoStep, CONFIRM_LOOK_INTO_STEP } from './unblockLookup';

import {
  UnblockDirectDepositStep,
  CONFIRM_DIRECT_DEPOSIT_STEP
} from './unblockDirectDeposit';

import i18n from '../locales/i18nConfig';
import { CallbackBotDialog } from '../callbackDialogs/callbackBotDialog';
import { TextBlock, adaptiveCard } from '../../cards';
import { UnblockDirectDepositMasterErrorStep, UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_STEP } from './unblockDirectDepositMasterErrorStep';
import { NEXT_OPTION_STEP, UnblockNextOptionStep } from './unblockNext';

export const UNBLOCK_BOT_DIALOG = 'UNBLOCK_BOT_DIALOG';
const MAIN_UNBLOCK_BOT_WATERFALL_DIALOG = 'MAIN_UNBLOCK_BOT_WATERFALL_DIALOG';

export class UnblockBotDialog extends ComponentDialog {
  constructor() {
    super(UNBLOCK_BOT_DIALOG);

    // Add the ConfirmLookIntoStep dialog to the dialog stack
    this.addDialog(new ConfirmLookIntoStep());
    this.addDialog(new UnblockDirectDepositStep());
    this.addDialog(new UnblockNextOptionStep());
    this.addDialog(new UnblockDirectDepositMasterErrorStep())
    this.addDialog(new CallbackBotDialog());

    this.addDialog(
      new WaterfallDialog(MAIN_UNBLOCK_BOT_WATERFALL_DIALOG, [
        this.welcomeStep.bind(this),
        this.confirmLookIntoStep.bind(this),
        this.unblockDirectDepositStep.bind(this),
        this.unblockNextOptionStep.bind(this),
        this.unblockMasterErrorStep.bind(this),
        this.finalStep.bind(this)
      ])
    );

    this.initialDialogId = MAIN_UNBLOCK_BOT_WATERFALL_DIALOG;
  }

  /**
   * 1. Initial step in the waterfall. This will kick of the unblockBot dialog
   * Most of the time this will just kick off the CONFIRM_LOOK_INTO_STEP dialog -
   * But in the off chance that the bot has already run through the switch statement
   * will take care of edge cases
   */
  async welcomeStep(stepContext: any) {
    // Get the unblockbot details / state machine for the current user
    const unblockBotDetails = stepContext.options;

    await adaptiveCard(
      stepContext,
      TextBlock(i18n.__('unblock_lookup_welcome_msg'))
    );
    return await stepContext.next(unblockBotDetails);
  }

  /**
   * 2. Confirm the user's intent to proceed with the unblockbot
   */
  async confirmLookIntoStep(stepContext: any) {
    // Get the state machine from the last step
    const unblockBotDetails = stepContext.result;

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
    // Check if a master error occurred and then end the dialog
    if (unblockBotDetails.masterError) {
      return await stepContext.endDialog(unblockBotDetails);
    } else {
      // If no master error occurred continue on to the next step
      switch (unblockBotDetails.unblockDirectDeposit) {
        // The flag in the state machine isn't set
        // so we are sending the user to that step
        case null:
          return await stepContext.beginDialog(
            CONFIRM_DIRECT_DEPOSIT_STEP,
            unblockBotDetails
          );

        // The confirmLookIntoStep flag in the state machine is set to true
        // so we are sending the user to next step
        case true:
          return await stepContext.next(unblockBotDetails);

        // The flag in the state machine is set to false
        // so we are sending to the end because they don't want to continue
        case false:
        default:
          return await stepContext.endDialog(unblockBotDetails);
      }
    }
  }

  async unblockNextOptionStep(stepContext) {
    // Get the state machine from the last step
    const unblockBotDetails = stepContext.result;
    // Check if a master error occurred and then end the dialog
    if (unblockBotDetails.masterError) {
      return await stepContext.endDialog(unblockBotDetails);
    } else {
      // If no master error occurred continue on to the next step
      switch (unblockBotDetails.nextOptionStep) {
        // The flag in the state machine isn't set
        // so we are sending the user to that step
        case null:
          return await stepContext.beginDialog(
            NEXT_OPTION_STEP,
            unblockBotDetails
          );

        // The confirmLookIntoStep flag in the state machine is set to true
        // so we are sending the user to next step
        case true:
          return await stepContext.next(unblockBotDetails);

        // The flag in the state machine is set to false
        // so we are sending to the end because they don't want to continue
        case false:
        default:
          return await stepContext.endDialog(unblockBotDetails);
      }
    }
  }
  /**
   * this is handle direct deposit master error scenario for unblock bot
   * @param stepContext
   * @returns
   *
   */
   async unblockMasterErrorStep(stepContext:any) {
    // Get the state machine from the last step
    const unblockBotDetails = stepContext.result;
    // Check if a master error occurred and then end the dialog
    if (  unblockBotDetails.masterError ) {
      return await stepContext.endDialog(unblockBotDetails);
    } else  {
      // If no master error occurred continue on to the next step
      switch (unblockBotDetails.directDepositMasterError) {
        // The flag in the state machine isn't set
        // so we are sending the user to that step
        case null:
          return await stepContext.beginDialog(
            UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_STEP,
            unblockBotDetails
          );
          // The flag in the state machine is set to true
        // so we are sending the user to next step
        case true:
          return await stepContext.next(unblockBotDetails);

        // The flag in the state machine is set to false
        // so we are sending to the end because they don't want to continue
        case false:

        default:
          return await stepContext.endDialog(unblockBotDetails);
      }
    }
  }
  /**
   * Final step in the waterfall. This will end the unblockBot dialog
   */
  async finalStep(stepContext) {
    // Get the results of the last ran step
    const unblockBotDetails = stepContext.result;

    // Check if a master error has occurred
    if (unblockBotDetails !== undefined && unblockBotDetails.masterError) {
      const masterErrorMsg = i18n.__('masterErrorMsg');
      await stepContext.context.sendActivity(masterErrorMsg);
    }

    return await stepContext.endDialog(unblockBotDetails);
  }
}
