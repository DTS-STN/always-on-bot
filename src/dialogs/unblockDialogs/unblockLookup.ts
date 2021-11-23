import {
  TextPrompt,
  ChoicePrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory
} from 'botbuilder-dialogs';

import {LUISUnblockSetup} from '../../utils/LUISAppSetup';
import { LuisRecognizer } from 'botbuilder-ai';

import i18n from '../locales/i18nConfig';
import {lookupUpdateSchema, TextBlock, addACard} from '../../cards';
import { CallbackBotDialog, CALLBACK_BOT_DIALOG } from '../callbackBotDialog';

import { CallbackBotDetails } from '../callbackBotDetails';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export const CONFIRM_LOOK_INTO_STEP = 'CONFIRM_LOOK_INTO_STEP';
const CONFIRM_LOOK_INTO_WATERFALL_STEP = 'CONFIRM_LOOK_INTO_STEP';
const MAX_ERROR_COUNT = 3;

export class ConfirmLookIntoStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_LOOK_INTO_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_LOOK_INTO_WATERFALL_STEP, [
        this.unblockLookupStart.bind(this),
        this.unblockLookupUserConfirm.bind(this),
        this.unblockLookupEnd.bind(this)
      ])
    );

    this.initialDialogId = CONFIRM_LOOK_INTO_WATERFALL_STEP;
  }

  /**
   * Initial step in the waterfall. This will kick of the ConfirmLookIntoStep step
   *
   * If the confirmLookIntoStep flag is set in the state machine then we can just
   * end this whole dialog
   *
   * If the confirmLookIntoStep flag is set to null then we need to get a response from the user
   *
   * If the user errors out then we're going to set the flag to false and assume they can't / don't
   * want to proceed
   */
  async unblockLookupStart(stepContext:any) {
    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // DEBUG
    // console.log('unblockLookupStart:', unblockBotDetails);

    // Check if the error count is greater than the max threshold
      // Throw the master error flag
      // Set master error message to send
    if (unblockBotDetails.errorCount.confirmLookIntoStep >= MAX_ERROR_COUNT) {
      unblockBotDetails.masterError = true;
      const errorMsg = i18n.__('masterErrorMsg');
      await stepContext.context.sendActivity(errorMsg);
      return await stepContext.endDialog(unblockBotDetails);
    }

    // Check the user state to see if unblockBotDetails.confirm_look_into_step is set to null or -1
      // If it is in the error state (-1) or or is set to null prompt the user
      // If it is false the user does not want to proceed
    if (
      unblockBotDetails.confirmLookIntoStep === null ||
      unblockBotDetails.confirmLookIntoStep === -1
    ) {

      // Set dialog messages
      let promptMsg:any;
      let adaptiveCard:any;
      const promptOptions = i18n.__('unblockLookup_prompt_opts');
      const retryMsg = i18n.__('confirmLookIntoStepRetryMsg');

      // Hard coded response simulation of bot lookup
      const LOOKUP_RESULT = 'foreign-bank-account'; // DEBUG

      if(LOOKUP_RESULT === 'foreign-bank-account') {
        adaptiveCard = addACard(lookupUpdateSchema(i18n.__('unblockLookup_update_reason')))
        promptMsg = i18n.__('unblockLookup_update_prompt_msg');
      } else {
        adaptiveCard = addACard(TextBlock(i18n.__('unblockLookup_blocked_msg')))
        promptMsg = i18n.__('unblockLookup_add_prompt_msg');
      }

      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          unblockBotDetails.confirmLookIntoStep === -1 ? retryMsg : promptMsg
        )
      };

      await stepContext.context.sendActivity(adaptiveCard);
      return await stepContext.prompt(TEXT_PROMPT, promptDetails);

    } else {
      return await stepContext.next(false);
    }
  }

  /**
   * Offer to have a Service Canada Officer contact them
   */
  async unblockLookupUserConfirm(stepContext:any) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Setup the LUIS to recognize intents
    const recognizer = LUISUnblockSetup(stepContext);
    const recognizerResult = await recognizer.recognize(stepContext.context);
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    // DEBUG
    // console.log('unblockLookupUserConfirm',unblockBotDetails, intent);

    switch (intent) {
      // Proceed
      case 'promptConfirmYes':
      case 'promptConfirmSendEmailYes':
        unblockBotDetails.confirmLookIntoStep = true;
        return await stepContext.next(unblockBotDetails);

      // Don't Proceed, offer callback
      case 'promptConfirmNo':
      case 'promptConfirmSendEmailNo':
        console.log('NO');
        unblockBotDetails.confirmLookIntoStep = false;
        return await stepContext.replaceDialog(
          CALLBACK_BOT_DIALOG,
          new CallbackBotDetails()
        );

      // Could not understand / No intent
      default: {
        unblockBotDetails.confirmLookIntoStep = -1;
        unblockBotDetails.errorCount.confirmLookIntoStep++;

        return await stepContext.replaceDialog(
          CONFIRM_LOOK_INTO_STEP,
          unblockBotDetails
        );
      }
    }
  }

  /**
   * Validation step in the waterfall.
   * We use LUIZ to process the prompt reply and then
   * update the state machine (unblockBotDetails)
   */
  async unblockLookupEnd(stepContext:any) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Setup the LUIS to recognize intents
    const recognizer = LUISUnblockSetup(stepContext);
    const recognizerResult = await recognizer.recognize(stepContext.context);
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    switch (intent) {

      // Proceed to callback bot
      case 'promptConfirmYes':
      case 'promptConfirmSendEmailYes':
        unblockBotDetails.confirmLookIntoStep = true;
        return await stepContext.next(unblockBotDetails);

      // Don't Proceed, ask for rating
      case 'promptConfirmNo':
      case 'promptConfirmSendEmailNo':

        // Set remaining steps to false (skip to the rating step)
        unblockBotDetails.confirmLookIntoStep = false;
        unblockBotDetails.unblockDirectDeposit = false;
        const confirmLookIntoStepCloseMsg = i18n.__('confirmLookIntoStepCloseMsg');

        await stepContext.context.sendActivity(confirmLookIntoStepCloseMsg);
        return await stepContext.endDialog(unblockBotDetails);

      // Could not understand / None intent, try again
      default: {
        // Catch all
        unblockBotDetails.confirmLookIntoStep = -1;
        unblockBotDetails.errorCount.confirmLookIntoStep++;

        return await stepContext.replaceDialog(
          CONFIRM_LOOK_INTO_STEP,
          unblockBotDetails
        );
      }
    }
  }
}
