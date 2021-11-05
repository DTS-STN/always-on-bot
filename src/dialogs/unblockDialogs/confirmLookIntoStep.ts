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
export const CONFIRM_LOOK_INTO_STEP = 'CONFIRM_LOOK_INTO_STEP';
const CONFIRM_LOOK_INTO_WATERFALL_STEP = 'CONFIRM_LOOK_INTO_STEP';
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
    endpointKey = process.env.LuisAPIKeyFR;
    endpoint = `https://${process.env.LuisAPIHostNameFR}.api.cognitive.microsoft.com`;
  } else {
    applicationId = process.env.LuisAppIdEN;
    endpointKey = process.env.LuisAPIKeyEN;
    endpoint = `https://${process.env.LuisAPIHostNameEN}.api.cognitive.microsoft.com`;
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


export class ConfirmLookIntoStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_LOOK_INTO_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_LOOK_INTO_WATERFALL_STEP, [
        this.initialStep.bind(this),
        this.secondStep.bind(this),
        this.finalStep.bind(this),
      ]),
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
  async initialStep(stepContext) {
    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // DEBUG
    console.log('DEBUG look into initialStep:', unblockBotDetails);

    // Set the text for the prompt
    const standardMsg = i18n.__('confirmLookIntoStepStandardMsg');

    // Set the text for the retry prompt
    const retryMsg = i18n.__('confirmLookIntoStepRetryMsg');

    // Check if the error count is greater than the max threshold
    if (unblockBotDetails.errorCount.confirmLookIntoStep >= MAX_ERROR_COUNT) {
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
      unblockBotDetails.confirmLookIntoStep === null ||
      unblockBotDetails.confirmLookIntoStep === -1
    ) {
      // Setup the prompt message
      var promptMsg = standardMsg;

      // The current step is an error state
      if (unblockBotDetails.confirmLookIntoStep === -1) {
        promptMsg = retryMsg;
      }

      const promptOptions = i18n.__('confirmLookIntoStepStandardPromptOptions');

      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          promptMsg,
        ),
      };

      return await stepContext.prompt(TEXT_PROMPT, promptDetails);
    } else {
      return await stepContext.next(false);
    }
  }

  /**
   * Offer to have a Service Canada Officer contact them
   */
  async secondStep(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Setup the LUIS app config and languages
    LUISAppSetup(stepContext);

    // Call prompts recognizer
    const recognizerResult = await recognizer.recognize(stepContext.context);

    const closeMsg = i18n.__('confirmLookIntoStepCloseMsg');

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    // DEBUG
    console.log('LOOKINTO - Second step',unblockBotDetails, intent);

    switch (intent) {
      // Proceed
      case 'promptConfirmYes':
        unblockBotDetails.confirmLookIntoStep = null;
        return await stepContext.endDialog(unblockBotDetails);

      // Don't Proceed, offer callback
      case 'promptConfirmNo':

        return await stepContext.replaceDialog(
          CALLBACK_BOT_DIALOG,
          new CallbackBotDetails(),
        );

      // Could not understand / No intent
      default: {
        unblockBotDetails.confirmLookIntoStep = -1;
        unblockBotDetails.errorCount.confirmLookIntoStep++;

        return await stepContext.replaceDialog(
          CONFIRM_LOOK_INTO_STEP,
          unblockBotDetails,
        );
      }
    }
  }

  /**
   * Validation step in the waterfall.
   * We use LUIZ to process the prompt reply and then
   * update the state machine (unblockBotDetails)
   */
  async finalStep(stepContext) {

    // Setup the LUIS app config and languages
    LUISAppSetup(stepContext);

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Call prompts recognizer
    const recognizerResult = await recognizer.recognize(stepContext.context);

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    //DEBUG
    console.log('LOOKINTO Final step', unblockBotDetails, intent);

    switch (intent) {

      // Proceed to callback bot
      case 'promptConfirmYes':
        unblockBotDetails.confirmLookIntoStep = false;
        unblockBotDetails.confirmHomeAddressStep = false;
        // return await stepContext.endDialog(unblockBotDetails);
        return await stepContext.replaceDialog(
          CALLBACK_BOT_DIALOG,
          new CallbackBotDetails(),
        );

      // Don't Proceed, ask for rating
      case 'promptConfirmNo':

        // Set remaining steps to false (skip to the rating step)
        unblockBotDetails.confirmLookIntoStep = false;
        unblockBotDetails.confirmHomeAddressStep = false;
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
          unblockBotDetails,
        );
      }
    }
  }
}
