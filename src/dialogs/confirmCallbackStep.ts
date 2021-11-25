import {
  TextPrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
  WaterfallStepContext
} from 'botbuilder-dialogs';

import { LuisRecognizer } from 'botbuilder-ai';

import i18n from './locales/i18nConfig';
import { CallbackBotDetails } from './callbackBotDetails';
import { CallbackRecognizer } from './calllbackDialogs/callbackRecognizer';

import {
  TextBlockWithLink,
  TextBlock,
  adaptiveCard}
from '../cards'

const TEXT_PROMPT = 'TEXT_PROMPT';
export const CONFIRM_CALLBACK_STEP = 'CONFIRM_CALLBACK_STEP';
const CONFIRM_CALLBACK_WATERFALL_STEP = 'CONFIRM_CALLBACK_WATERFALL_STEP';

const MAX_ERROR_COUNT = 3;

export class ConfirmCallbackStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_CALLBACK_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_CALLBACK_WATERFALL_STEP, [
        this.preStep.bind(this),
        this.finalStep.bind(this)
      ])
    );

    this.initialDialogId = CONFIRM_CALLBACK_WATERFALL_STEP;
  }
  async preStep(stepContext: WaterfallStepContext) {
    // Get the user details / state machine
    const callbackBotDetails: CallbackBotDetails =
      stepContext.options as CallbackBotDetails;

    // Set the text for the prompt
    let okMsg:any;
    let standardMsg:any;

    console.log(callbackBotDetails.directDepositError)

    // Deteremine what dialog caused the error and display approriate message
    if(callbackBotDetails.directDepositError === true){
        okMsg = false;
        standardMsg = i18n.__('unblock_direct_deposit_main_error');
    } else {
      okMsg = i18n.__('OKMsg');
      standardMsg = i18n.__('callbackBotDialogStepStandardMsg');
    }

    // Set the text for the retry prompt
    const retryMsg = i18n.__('confirmCallbackStepRetryMsg');

    // Check if the error count is greater than the max threshold
    if (callbackBotDetails.errorCount.confirmLookIntoStep >= MAX_ERROR_COUNT) {
      console.log('CALLBACK');
      // Throw the master error flag
      callbackBotDetails.masterError = true;

      // Set master error message to send
      const errorMsg = i18n.__('confirmCallbackStepErrorMsg');

      // Send master error message
      await adaptiveCard(stepContext, TextBlock(errorMsg));

      // End the dialog and pass the updated details state machine
      return await stepContext.endDialog(callbackBotDetails);
    }

    // Check the user state to see if callbackBotDetails.confirmCallbackStep is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      callbackBotDetails.confirmCallbackStep === null ||
      callbackBotDetails.confirmCallbackStep === -1
    ) {
      // Setup the prompt message
      let promptMsg = standardMsg;

      // The current step is an error state
      if (callbackBotDetails.confirmCallbackStep === -1) {
        promptMsg = retryMsg;
      }

      // Only show Ok for main dialog
      if(okMsg) {
        await adaptiveCard(stepContext, TextBlock(okMsg));
      }

      const promptOptions: any = i18n.__(
        'confirmCallbackStandardPromptOptions'
      );
      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          promptMsg
        )
      };

      return await stepContext.prompt(TEXT_PROMPT, promptDetails);
    } else {
      return await stepContext.next(false);
    }
  }


  /**
   * Validation step in the waterfall.
   * We use LUIZ to process the prompt reply and then
   * update the state machine (callbackBotDetails)
   */
  async finalStep(stepContext) {
    // Get the user details / state machine
    const callbackDetails = stepContext.options;
    let luisRecognizer;
    let lang = 'en';
    // Language check

    // Then change LUIZ appID
    if (
      stepContext.context.activity.locale.toLowerCase() === 'fr-ca' ||
      stepContext.context.activity.locale.toLowerCase() === 'fr-fr'
    ) {
      lang = 'fr';
    }

    // LUIZ Recogniser processing
    luisRecognizer = new CallbackRecognizer(lang);
    // Call prompts recognizer
    const recognizerResult = await luisRecognizer.executeLuisQuery(
      stepContext.context
    );

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    // const closeMsg = i18n.__('confirmCallbackStepCloseMsg');

    const closeMsg = i18n.__('unblockLookup_decline_callback_msg');
    const link = i18n.__('unblockLookup_decline_callback_link');
    const linkMsg = i18n.__('unblockLookup_decline_callback_link_msg');

    switch (intent) {
      // Proceed
      case 'promptConfirmYes':
        console.log('INTENT: ', intent);
        callbackDetails.confirmCallbackStep = true;
        const firstWelcomeMsg = i18n.__('getCallbackScheduleStandardMsg');
        const standardMsgContinue = i18n.__('confirmAuthStepMsg');
        const confirmationCodeMsg = i18n.__('confirmAuthWordStepStandardMsg');
        await stepContext.context.sendActivity(firstWelcomeMsg);
        await stepContext.context.sendActivity(standardMsgContinue);
        await stepContext.context.sendActivity(confirmationCodeMsg);
        return await stepContext.endDialog(callbackDetails);

      // Don't Proceed
      case 'promptConfirmNo':
        console.log('INTENT: ', intent);

        // await stepContext.context.sendActivity(closeMsg);
        await adaptiveCard(stepContext, TextBlockWithLink(closeMsg, link, linkMsg));

        callbackDetails.confirmCallbackStep = false;
        return await stepContext.endDialog(callbackDetails);

      // Could not understand / None intent
      default: {
        // Catch all
        console.log('NONE INTENT-');
        callbackDetails.confirmLookIntoStep = -1;
        callbackDetails.errorCount.confirmLookIntoStep++;

        return await stepContext.replaceDialog(
          CONFIRM_CALLBACK_STEP,
          callbackDetails
        );
      }
    }
  }
}
