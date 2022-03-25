import {
  TextPrompt,
  ChoicePrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
  ListStyle
} from 'botbuilder-dialogs';

import { LuisRecognizer } from 'botbuilder-ai';

import i18n from '../locales/i18nConfig';
import { adaptiveCard, TextBlock, TextBlockWithLink } from '../../cards';
import { CONFIRM_DIRECT_DEPOSIT_STEP } from './unblockDirectDeposit';
import { UnblockRecognizer } from './unblockRecognizer';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export const CONFIRM_LOOK_INTO_STEP = 'CONFIRM_LOOK_INTO_STEP';
const CONFIRM_LOOK_INTO_WATERFALL_STEP = 'CONFIRM_LOOK_INTO_WATERFALL_STEP';
import { MAX_ERROR_COUNT}  from '../../utils'
import { callbackCard } from '../../cards/callbackCard';
import { NEXT_OPTION_STEP } from './unblockNext';

export class ConfirmLookIntoStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_LOOK_INTO_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_LOOK_INTO_WATERFALL_STEP, [
        this.unblockLookupStart.bind(this),
        this.unblockLookupUserConfirm.bind(this)

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
  async unblockLookupStart(stepContext: any) {
    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Check if the error count is greater than the max threshold
    // Throw the master error flag
    // Set master error message to send
    if (unblockBotDetails.errorCount.confirmLookIntoStep >= MAX_ERROR_COUNT) {
      unblockBotDetails.masterError = true;
      const errorMsg = i18n.__(`MasterRetryExceededMessage`);
      await adaptiveCard(stepContext, callbackCard(stepContext.context.activity.locale,errorMsg));
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
      let promptMsg: any;
      let cardMessage = null;
      let oasGreetingMsg = '';
      const promptOptions = i18n.__('unblock_lookup_prompt_opts');
      const retryMsg = i18n.__('confirmLookIntoStepRetryMsg');

      // Hard coded response simulation of bot lookup
      const LOOKUP_RESULT = 'foreign-bank-account'; // DEBUG
      // LOOKUP_RESULT = null;

      if (LOOKUP_RESULT === 'foreign-bank-account') {
        oasGreetingMsg = i18n.__('unblock_lookup_update_msg');
        cardMessage = i18n.__('unblock_lookup_update_reason');
        promptMsg = i18n.__('unblock_lookup_update_prompt_msg');
      } else {
        oasGreetingMsg = i18n.__('unblock_lookup_update_msg');
        promptMsg = i18n.__('unblock_lookup_add_prompt_msg');
      }

      // Setup the prompt
      const promptText =
        unblockBotDetails.confirmLookIntoStep === -1 ? retryMsg : promptMsg;
      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          promptText
        ),
        style: ListStyle.suggestedAction
      };
      if (unblockBotDetails.confirmLookIntoStep !== -1) {
        // Send the welcome message and text prompt
        await adaptiveCard(stepContext, TextBlock(oasGreetingMsg));
        if (cardMessage) {
          await adaptiveCard(stepContext, TextBlock(cardMessage));
        }
      }

      return await stepContext.prompt(TEXT_PROMPT, promptDetails);
    } else {
      return await stepContext.next(false);
    }
  }

  /**
   * Offer to have a Service Canada Officer contact them
   */
  async unblockLookupUserConfirm(stepContext: any) {
    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Setup the LUIS to recognize intents
    let luisRecognizer;
    let lang = 'en';
    // Language check

    // Then change LUIZ appID
    if (
      stepContext.context.activity.locale.toLowerCase() === 'fr-ca' ||
      stepContext.context.activity.locale.toLowerCase() === 'fr-fr' ||
      stepContext.context.activity.locale.toLowerCase() === 'fr'
    ) {
      lang = 'fr';
    }

    // LUIZ Recogniser processing
    luisRecognizer = new UnblockRecognizer(lang);
    // Call prompts recognizer
    const recognizerResult = await luisRecognizer.executeLuisQuery(
      stepContext.context
    );

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    switch (intent) {
      // Proceed
      case 'promptConfirmYes':
        unblockBotDetails.confirmLookIntoStep = true;

        // Do the direct deposit step
        return await stepContext.replaceDialog(
          CONFIRM_DIRECT_DEPOSIT_STEP,
          unblockBotDetails
        );

      // Don't Proceed, but confirm they don't want to
      case 'promptConfirmNo':
        unblockBotDetails.confirmLookIntoStep = false;

        unblockBotDetails.unblockDirectDeposit = false;

        const text = i18n.__('unblock_lookup_decline_final_text');
        const link = i18n.__('unblock_lookup_decline_callback_link');
        const linkText = i18n.__('unblock_lookup_decline_final_link_text');

        await adaptiveCard(stepContext, TextBlockWithLink(text, link, linkText));
        // return await stepContext.endDialog(unblockBotDetails);
        return await stepContext.replaceDialog(
          NEXT_OPTION_STEP,
          unblockBotDetails
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



}
