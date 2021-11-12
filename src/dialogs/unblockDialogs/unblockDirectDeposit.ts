import {
  TextPrompt,
  ChoicePrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
} from 'botbuilder-dialogs';

import { LuisRecognizer } from 'botbuilder-ai';

import i18n from '../locales/i18nConfig';

import { CallbackBotDialog, CALLBACK_BOT_DIALOG } from '../callbackBotDialog';

import { CallbackBotDetails } from '../callbackBotDetails';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export const CONFIRM_DIRECT_DEPOSIT_STEP = 'CONFIRM_DIRECT_DEPOSIT_STEP';
const CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP = 'CONFIRM_DIRECT_DEPOSIT_STEP';

// Error handling
const MAX_ERROR_COUNT = 3;
let INSTITUTE = false
let TRANSIT = false;

export class UnblockDirectDepositStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_DIRECT_DEPOSIT_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP, [
        this.unblockDirectDepositStart.bind(this),
        this.unblockBankInstitute.bind(this),
        this.unblockDirectDepositEnd.bind(this),
      ]),
    );

    this.initialDialogId = CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP;
  }

  /**
   * Initial step in the waterfall. This will kick of the UnblockDirectDepositStep step
   */
  async unblockDirectDepositStart(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Check if the error count is greater than the max threshold
    if (unblockBotDetails.errorCount.unblockDirectDeposit >= MAX_ERROR_COUNT) {

      unblockBotDetails.masterError = true;
      unblockBotDetails.unblockDirectDeposit = null;

      return await stepContext.replaceDialog(
        CALLBACK_BOT_DIALOG,
        new CallbackBotDetails(),
      );
    }

    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      unblockBotDetails.unblockDirectDeposit === null ||
      unblockBotDetails.unblockDirectDeposit === -1 ||
      unblockBotDetails.unblockDirectDeposit === 0
    ) {

      // Set dialog messages
      const standardMsg       = i18n.__('unblock_direct_deposit_msg');
      const infoMsg           = i18n.__('unblock_direct_deposit_how_to');
      const listOfItems       = i18n.__('unblock_direct_deposit_prompt_opts');
      let promptMsg           = '';
      let retryMsg            = '';

      // If first pass through, show welcome messaging
      if(unblockBotDetails.unblockDirectDeposit === null) {
        await stepContext.context.sendActivity(standardMsg);
        await stepContext.context.sendActivity(listOfItems);
        await stepContext.context.sendActivity(infoMsg);
      }

      // State of unblock direct deposit determines message prompts
      if(TRANSIT === true) { //ACCOUNT
        promptMsg = i18n.__('unblock_direct_deposit_account');
        retryMsg= i18n.__('unblock_direct_deposit_account_retry');

        if(unblockBotDetails.unblockDirectDeposit === -1)
          await stepContext.context.sendActivity(retryMsg);

      } else if(INSTITUTE === true) { //TRANSIT
        promptMsg = i18n.__('unblock_direct_deposit_transit');
        retryMsg= i18n.__('unblock_direct_deposit_transit_retry');

        if(unblockBotDetails.unblockDirectDeposit === -1)
          await stepContext.context.sendActivity(retryMsg);

      } else { //INSTITUTE
        promptMsg =  i18n.__('unblock_direct_deposit_institute');
        retryMsg = i18n.__('unblock_direct_deposit_institute_retry');

        if(unblockBotDetails.unblockDirectDeposit === -1)
          await stepContext.context.sendActivity(retryMsg);

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
  async unblockBankInstitute(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;
    const userInput = stepContext._info ? stepContext._info.result : null;

    //TODO
    // Implement regex to see if it is a valid number

    // DEBUG
    // console.log('unblockBankInstitute',unblockBotDetails);

    if(userInput === "333") {
      INSTITUTE = true;
      unblockBotDetails.unblockDirectDeposit = 0;
      unblockBotDetails.errorCount.unblockDirectDeposit = 0;
    } else if(userInput === "55555") {
      TRANSIT = true;
      unblockBotDetails.unblockDirectDeposit = 0;
      unblockBotDetails.errorCount.unblockDirectDeposit = 0;
    } else if (userInput === "7777777") {
      unblockBotDetails.unblockDirectDeposit = true;
    } else {
      unblockBotDetails.unblockDirectDeposit = -1;
      unblockBotDetails.errorCount.unblockDirectDeposit++;
    }

    if(unblockBotDetails.unblockDirectDeposit === true) {
      const validMsg = i18n.__('unblock_direct_deposit_valid_msg');
      const validTip = i18n.__('unblock_direct_deposit_valid_tip');
      const validReminder = i18n.__('unblock_direct_deposit_valid_reminder');

      await stepContext.context.sendActivity(validMsg);
      await stepContext.context.sendActivity(validTip);
      await stepContext.context.sendActivity(validReminder);

      return await stepContext.endDialog(unblockBotDetails);
    } else {
      return await stepContext.replaceDialog(
        CONFIRM_DIRECT_DEPOSIT_STEP,
        unblockBotDetails,
      );
    }

  }
}