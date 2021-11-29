import {
  TextPrompt,
  ChoicePrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory
} from 'botbuilder-dialogs';

import {LUISUnblockSetup} from '../../utils/luisAppSetup';
import { LuisRecognizer } from 'botbuilder-ai';

import i18n from '../locales/i18nConfig';
import {adaptiveCard, TextBlock, TextBlockWithLink} from '../../cards';
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
      await adaptiveCard(stepContext, TextBlock(errorMsg));
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
      let cardMessage = null;
      let oasGreetingMsg = '';
      const promptOptions = i18n.__('unblock_lookup_prompt_opts');
      const retryMsg = i18n.__('confirmLookIntoStepRetryMsg');

      // Hard coded response simulation of bot lookup
      const LOOKUP_RESULT = 'foreign-bank-account'; // DEBUG
      // LOOKUP_RESULT = null;

      if(LOOKUP_RESULT === 'foreign-bank-account') {
        oasGreetingMsg = i18n.__('unblock_lookup_update_msg');
        cardMessage = i18n.__('unblock_lookup_update_reason');
        promptMsg = i18n.__('unblock_lookup_update_prompt_msg');
      } else {
        oasGreetingMsg = i18n.__('unblock_lookup_update_msg');
        promptMsg = i18n.__('unblock_lookup_add_prompt_msg');
      }

      // Setup the prompt
      const promptText = unblockBotDetails.confirmLookIntoStep === -1 ? retryMsg : promptMsg
      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          promptText
        )
      };

      // Send the welcome message and text prompt
      await adaptiveCard(stepContext, TextBlock(oasGreetingMsg));
      if(cardMessage) {
        await adaptiveCard(stepContext, TextBlock(cardMessage));
      }

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
    console.log('unblockLookupUserConfirm',unblockBotDetails, intent);

    switch (intent) {
      // Proceed
      case 'promptConfirmYes':
        unblockBotDetails.confirmLookIntoStep = true;
        return await stepContext.next(unblockBotDetails);

      // Don't Proceed, but confirm they don't want to
      case 'promptConfirmNo':
        unblockBotDetails.confirmLookIntoStep = false;

        const promptText = i18n.__('unblock_lookup_prompt_confirm_msg');
        const promptOptions = i18n.__('unblock_lookup_prompt_confirm_opts');
        const promptDetails = {
          prompt: ChoiceFactory.forChannel(
            stepContext.context,
            promptOptions,
            promptText
          )
        };

        return await stepContext.prompt(TEXT_PROMPT, promptDetails);

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

    // DEBUG
    console.log('unblockLookupEnd',unblockBotDetails, intent);

    switch (intent) {

      // Proceed to callback bot
      case 'promptConfirmYes':
        unblockBotDetails.confirmLookIntoStep = false;
        unblockBotDetails.unblockDirectDeposit = false;

        const text = i18n.__('unblock_lookup_decline_final_text');
        const link = i18n.__('unblock_lookup_decline_callback_link');
        const linkText = i18n.__('unblock_lookup_decline_final_link_text');

        adaptiveCard(stepContext, TextBlockWithLink(text, link, linkText));



        return await stepContext.endDialog(unblockBotDetails);

      // Don't Proceed, ask for rating
      case 'promptConfirmNo':

        // Set remaining steps to false (skip to the rating step)
        unblockBotDetails.confirmLookIntoStep = true;
        unblockBotDetails.unblockDirectDeposit = true;
        const confirmLookIntoStepCloseMsg = i18n.__('confirmLookIntoStepCloseMsg');

        await adaptiveCard(stepContext, TextBlock(confirmLookIntoStepCloseMsg));
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
