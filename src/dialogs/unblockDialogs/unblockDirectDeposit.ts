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
const MAX_ERROR_COUNT = 3;

// Luis Application Settings
let applicationId = '';
let endpointKey = '';
let endpoint = '';
let recognizer;

const LUISAppSetup = (stepContext) => {
  // Then change LUIZ appID
  if (
    stepContext.context.activity.locale.toLowerCase() === 'fr-ca' ||
    stepContext.context.activity.locale.toLowerCase() === 'fr-fr'
  ) {
    applicationId = process.env.LuisAppIdFR;
    endpointKey   = process.env.LuisAPIKeyFR;
    endpoint      = `https://${process.env.LuisAPIHostNameFR}.api.cognitive.microsoft.com`;
  } else {
    applicationId = process.env.LuisAppIdEN;
    endpointKey   = process.env.LuisAPIKeyEN;
    endpoint      = `https://${process.env.LuisAPIHostNameEN}.api.cognitive.microsoft.com`;
  }

  // LUIZ Recogniser processing
  recognizer = new LuisRecognizer(
    {
      applicationId: applicationId,
      endpointKey: endpointKey,
      endpoint: endpoint,
    },
    {
      includeAllIntents: true,
      includeInstanceData: true,
    },
    true,
  );
}


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
        this.unblockBankTransit.bind(this),
        this.unblockBankAccount.bind(this),
        this.unblockBankInstitute.bind(this),
        this.unblockDirectDepositEnd.bind(this),
      ]),
    );

    this.initialDialogId = CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP;
  }

  /**
   * Initial step in the waterfall. This will kick of the UnblockDirectDepositStep step
   *
   * If the confirmLookIntoStep flag is set in the state machine then we can just
   * end this whole dialog
   *
   * If the confirmLookIntoStep flag is set to null then we need to get a response from the user
   *
   * If the user errors out then we're going to set the flag to false and assume they can't / don't
   * want to proceed
   */
  async unblockDirectDepositStart(stepContext) {
    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // DEBUG
    console.log('unblockDirectDepositInit:', unblockBotDetails);

    // Check if the error count is greater than the max threshold
    if (unblockBotDetails.errorCount.unblockDirectDeposit >= MAX_ERROR_COUNT) {
      // Throw the master error flag
      unblockBotDetails.masterError = true;

      // Set master error message to send
      const errorMsg = i18n.__('masterErrorMsg');

      // Send master error message
      await stepContext.context.sendActivity(errorMsg);

      // End the dialog and pass the updated details state machine
      return await stepContext.endDialog(unblockBotDetails);
    }

    // Check the user state to see if unblockBotDetails.confirm_look_into_step is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      unblockBotDetails.unblockDirectDeposit === null ||
      unblockBotDetails.unblockDirectDeposit === -1
    ) {

      // Set dialog messages
      const standardMsg       = i18n.__('unblock_direct_deposit_msg');
      const infoMsg           = i18n.__('unblock_direct_deposit_how_to');
      const bankInstituteMsg  = i18n.__('unblock_direct_deposit_institute');
      const retryMsg          = i18n.__('unblock_direct_deposit_retry');
      const promptMsg = unblockBotDetails.unblockDirectDeposit === -1 ? retryMsg : bankInstituteMsg;

      await stepContext.context.sendActivity(standardMsg);
      await stepContext.context.sendActivity(infoMsg);
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
    const userInput = stepContext._info ? stepContext._info.result : false;

    // DEBUG
    console.log('unblockBankInstitute',unblockBotDetails, userInput);

    switch (userInput) {
      case '001':
      case '333':
        // Update step state
        unblockBotDetails.unblockDirectDepositState.institute = userInput;

        // Set dialog messages and prompt
        const bankTransitMsg  = i18n.__('unblock_direct_deposit_transit');
        return await stepContext.prompt(TEXT_PROMPT, { prompt: bankTransitMsg });

      default:

        unblockBotDetails.unblockDirectDeposit = -1;
        unblockBotDetails.errorCount.unblockDirectDeposit++;

        return await stepContext.replaceDialog(
          CONFIRM_DIRECT_DEPOSIT_STEP,
          unblockBotDetails,
        );

    }

  }

  /**
   * Offer to have a Service Canada Officer contact them
   */
   async unblockBankTransit(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;
    // console.log(stepContext);
    const userInput = stepContext._info ? stepContext._info.result : false;

    // DEBUG
    console.log('unblockBankTransit',unblockBotDetails, userInput);

    switch (userInput) {
      case '55555':
        // Update step state
        unblockBotDetails.unblockDirectDepositState.transit = userInput;

        // Set dialog messages and prompt
        const bankAccountMsg  = i18n.__('unblock_direct_deposit_account');
        return await stepContext.prompt(TEXT_PROMPT, { prompt: bankAccountMsg });

      default:

        unblockBotDetails.unblockDirectDeposit = -1;
        unblockBotDetails.errorCount.unblockDirectDeposit++;

        return await stepContext.replaceDialog(
          CONFIRM_DIRECT_DEPOSIT_STEP,
          unblockBotDetails,
        );

    }

  }

  /**
   * Offer to have a Service Canada Officer contact them
   */
   async unblockBankAccount(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;
    console.log(stepContext);
    const userInput = stepContext._info ? stepContext._info.result : false;

    // DEBUG
    console.log('unblockBankAccount',unblockBotDetails, userInput);

    switch (userInput) {
      case '7777777':
        // Update step state
        unblockBotDetails.unblockDirectDepositState.account = userInput;

        // Set dialog messages and prompt
        const directDepositValid  = i18n.__('unblock_direct_deposit_valid_msg');
        const directDepositTip  = i18n.__('unblock_direct_deposit_valid_tip');
        const directDepositReminder  = i18n.__('unblock_direct_deposit_valid_reminder');

        await stepContext.context.sendActivity(directDepositValid);
        await stepContext.context.sendActivity(directDepositTip);
        await stepContext.context.sendActivity(directDepositReminder);

        return await stepContext.endDialog(unblockBotDetails);

      default:

        unblockBotDetails.unblockDirectDeposit = -1;
        unblockBotDetails.errorCount.unblockDirectDeposit++;

        return await stepContext.replaceDialog(
          CONFIRM_DIRECT_DEPOSIT_STEP,
          unblockBotDetails,
        );

    }
  }

  /**
   * Validation step in the waterfall.
   * We use LUIZ to process the prompt reply and then
   * update the state machine (unblockBotDetails)
   */
  async unblockDirectDepositEnd(stepContext) {

    // Setup the LUIS app config and languages
    LUISAppSetup(stepContext);

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Call prompts recognizer
    const recognizerResult = await recognizer.recognize(stepContext.context);

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    //DEBUG
    console.log('unblockDirectDepositEnd', unblockBotDetails, intent);

    switch (intent) {

      // Proceed to callback bot
      case 'promptConfirmYes':
        unblockBotDetails.unblockDirectDeposit = false;
        unblockBotDetails.confirmHomeAddressStep = false;
        // return await stepContext.endDialog(unblockBotDetails);
        return await stepContext.replaceDialog(
          CALLBACK_BOT_DIALOG,
          new CallbackBotDetails(),
        );

      // Don't Proceed, ask for rating
      case 'promptConfirmNo':

        // Set remaining steps to false (skip to the rating step)
        unblockBotDetails.unblockDirectDeposit = false;
        unblockBotDetails.confirmHomeAddressStep = false;
        const confirmLookIntoStepCloseMsg = i18n.__('confirmLookIntoStepCloseMsg');

        await stepContext.context.sendActivity(confirmLookIntoStepCloseMsg);
        return await stepContext.endDialog(unblockBotDetails);

      // Could not understand / None intent, try again
      default: {
        // Catch all
        unblockBotDetails.unblockDirectDeposit = -1;
        unblockBotDetails.errorCount.unblockDirectDeposit++;

        return await stepContext.replaceDialog(
          CONFIRM_DIRECT_DEPOSIT_STEP,
          unblockBotDetails,
        );
      }
    }
  }
}
