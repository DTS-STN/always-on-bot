import {
  TextPrompt,
  ChoicePrompt,
  ComponentDialog,
  WaterfallDialog
} from 'botbuilder-dialogs';

import i18n from '../locales/i18nConfig';

import {
  whatNumbersToFindSchema,
  howToFindNumbersSchema,
  TwoTextBlock,
  TextBlock,
  adaptiveCard}
from '../../cards'

import { CallbackBotDialog, CALLBACK_BOT_DIALOG } from '../callbackBotDialog';
import { CallbackBotDetails } from '../callbackBotDetails';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export const CONFIRM_DIRECT_DEPOSIT_STEP = 'CONFIRM_DIRECT_DEPOSIT_STEP';
const CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP = 'CONFIRM_DIRECT_DEPOSIT_STEP';

// Error handling
const MAX_ERROR_COUNT = 3;
const ACCOUNT = false;
let TRANSIT = false;
let INSTITUTE = false

export class UnblockDirectDepositStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_DIRECT_DEPOSIT_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP, [
        this.unblockDirectDepositStart.bind(this),
        this.unblockBankDetails.bind(this),
        this.unblockDirectDepositEnd.bind(this)
      ])
    );

    this.initialDialogId = CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP;
  }

  /**
   * Initial step in the waterfall. This will kick of the UnblockDirectDepositStep step
   */
  async unblockDirectDepositStart(stepContext:any) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Check if the error count is greater than the max threshold
    if (unblockBotDetails.errorCount.unblockDirectDeposit >= MAX_ERROR_COUNT) {

      unblockBotDetails.masterError = true;
      unblockBotDetails.unblockDirectDeposit = -1;

      const callbackErrorCause = new CallbackBotDetails();
      callbackErrorCause.directDepositError = true;

      return await stepContext.replaceDialog(
        CALLBACK_BOT_DIALOG,
        callbackErrorCause
      );
    }

    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    // If it is 0, we hvae some direct deposit info but not all of it
    if (
      unblockBotDetails.unblockDirectDeposit === null ||
      unblockBotDetails.unblockDirectDeposit === -1 ||
      unblockBotDetails.unblockDirectDeposit === 0
    ) {

      // Set dialog messages
      let promptMsg           = '';
      let retryMsg            = '';

      // State of unblock direct deposit determines message prompts
      if(INSTITUTE === true) { // ACCOUNT
        promptMsg = i18n.__('unblock_direct_deposit_account');
        retryMsg= i18n.__('unblock_direct_deposit_account_retry');

        if(unblockBotDetails.unblockDirectDeposit === -1) {
          await adaptiveCard(stepContext, TextBlock(retryMsg));
        }

      } else if(TRANSIT === true) { // INSTITUTE
        promptMsg =  i18n.__('unblock_direct_deposit_institute');
        retryMsg = i18n.__('unblock_direct_deposit_institute_retry');

        if(unblockBotDetails.unblockDirectDeposit === -1) {
          await adaptiveCard(stepContext, TextBlock(retryMsg));
        }

      } else { // TRANSIT
        promptMsg = i18n.__('unblock_direct_deposit_transit');
        retryMsg = i18n.__('unblock_direct_deposit_transit_retry');

        if(unblockBotDetails.unblockDirectDeposit === -1) {
          await adaptiveCard(stepContext, TextBlock(retryMsg));
        }
      }

      // If first pass through, show welcome messaging (adative cards)
      if(unblockBotDetails.unblockDirectDeposit === null) {
        await adaptiveCard(stepContext, whatNumbersToFindSchema());
        await adaptiveCard(stepContext, howToFindNumbersSchema());
      }

      // Prompt the user to enter their bank information
      return await stepContext.prompt(TEXT_PROMPT, { prompt: promptMsg });

    } else {
      return await stepContext.next(false);
    }
  }

  /**
   * Offer to have a Service Canada Officer contact them
   */
  async unblockBankDetails(stepContext:any) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;
    const userInput = stepContext._info ? stepContext._info.result : null;

    // Validate numeric input
    let numLength = 0;
    if(INSTITUTE === true) { // Account
      numLength = 7;
    } else if(TRANSIT === true) { // Transit
      numLength = 3;
    } else { // Transit
      numLength = 5;
    }
    const numberRegex = /^\d+$/;
    const validNumber = numberRegex.test(userInput);

    // console.log('-------');
    // console.log('TRANSIT', TRANSIT);
    // console.log('INSTITUTE', INSTITUTE);
    // console.log('numLength', numLength);

    // If valid number matches requested value lenght
    if (validNumber && userInput.length === numLength && TRANSIT === false) {
      TRANSIT = true;
      unblockBotDetails.unblockDirectDeposit = 0;
      unblockBotDetails.errorCount.unblockDirectDeposit = 0;
    } else if (validNumber && userInput.length === numLength && INSTITUTE === false) {
      INSTITUTE = true;
      unblockBotDetails.unblockDirectDeposit = 0;
      unblockBotDetails.errorCount.unblockDirectDeposit = 0;
    } else if (validNumber && userInput.length === numLength && INSTITUTE === true && TRANSIT === true && ACCOUNT === false) {
      unblockBotDetails.unblockDirectDeposit = true; // Proceed
      TRANSIT = false; // Reset
      INSTITUTE = false; // Reset
    } else {
      unblockBotDetails.unblockDirectDeposit = -1;
      unblockBotDetails.errorCount.unblockDirectDeposit++;
    }

    // Next step for pass, or repeat as needed
    if(unblockBotDetails.unblockDirectDeposit === true) {
      return await stepContext.next(unblockBotDetails);
    } else {
      return await stepContext.replaceDialog(
        CONFIRM_DIRECT_DEPOSIT_STEP,
        unblockBotDetails
      );
    }
  }

  /**
   * End Direct Deposit Waterfall
   */
  async unblockDirectDepositEnd(stepContext:any) {

    // Set the messages
    const unblockBotDetails = stepContext.result;
    const validReminder = i18n.__('unblock_direct_deposit_valid_reminder');
    const doneMsg = i18n.__('unblock_direct_deposit_complete');
    const validMsg = i18n.__('unblock_direct_deposit_valid_msg');
    const tipMsg = i18n.__('unblock_direct_deposit_valid_tip')

    // Display the prompts
    await adaptiveCard(stepContext, TwoTextBlock(validMsg, tipMsg));
    await adaptiveCard(stepContext, TextBlock(validReminder));
    await adaptiveCard(stepContext, TextBlock(doneMsg));

    // End the dialog
    return await stepContext.endDialog(unblockBotDetails);
  }
}
