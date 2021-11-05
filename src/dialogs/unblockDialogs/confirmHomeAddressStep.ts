import {
  TextPrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
} from 'botbuilder-dialogs';

import { LuisRecognizer } from 'botbuilder-ai';

import i18n from '../locales/i18nConfig';

import { CallbackBotDialog, CALLBACK_BOT_DIALOG } from '../callbackBotDialog';

import { CallbackBotDetails } from '../callbackBotDetails';
const TEXT_PROMPT = 'TEXT_PROMPT';
export const CONFIRM_HOME_ADDRESS_STEP = 'CONFIRM_HOME_ADDRESS_STEP';
const CONFIRM_HOME_ADDRESS_STEP_WATERFALL_STEP =
  'CONFIRM_HOME_ADDRESS_STEP_WATERFALL_STEP';

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

export class ConfirmHomeAddressStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_HOME_ADDRESS_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_HOME_ADDRESS_STEP_WATERFALL_STEP, [
        this.initialStep.bind(this),
        this.secondStep.bind(this),
        this.thirdStep.bind(this),
        this.fourthStep.bind(this),
        this.finalStep.bind(this),
      ]),
    );

    this.initialDialogId = CONFIRM_HOME_ADDRESS_STEP_WATERFALL_STEP;
  }

  /**
   * Initial step in the waterfall. This will kick of the ConfirmHomeAddressStep step
   *
   * If the confirmHomeAddressStep flag is set in the state machine then we can just
   * end this whole dialog
   *
   * If the confirmHomeAddressStep flag is set to null then we need to get a response from the user
   *
   * If the user errors out then we're going to set the flag to false and assume they can't / don't
   * want to proceed
   */
  async initialStep(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // DEBUG
    console.log('INITIAL STEP - HOME ADDRESS', unblockBotDetails);

    // Set the text for the prompt
    const standardMsg = i18n.__('confirmHomeAddressStepStandardMsg');

    // Set the text for the retry prompt
    const retryMsg = i18n.__('confirmHomeAddressStepRetryMsg');

    // Set the text for the prompt
    const queryMsg = i18n.__('confirmHomeAddressStepQueryMsg');

    // Check if the error count is greater than the max threshold
    if (unblockBotDetails.errorCount.confirmHomeAddressStep >= MAX_ERROR_COUNT) {

      console.log('ADDRESS ERROR #'+unblockBotDetails.errorCount.confirmHomeAddressStep);

      // Throw the master error flag
      unblockBotDetails.masterError = true;
      unblockBotDetails.confirmHomeAddressStep = null;
      return await stepContext.replaceDialog(
        CALLBACK_BOT_DIALOG,
        new CallbackBotDetails(),
      );

    }

    // Check the user state to see if unblockBotDetails.confirmHomeAddressStep is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      unblockBotDetails.confirmHomeAddressStep === null ||
      unblockBotDetails.confirmHomeAddressStep === -1
    ) {

      // Setup the prompt message
      var promptMsg = '';

      // The current step is an error state
      if (unblockBotDetails.confirmHomeAddressStep === -1) {
        promptMsg = retryMsg;
      } else {
        promptMsg = standardMsg;
      }

      return await stepContext.prompt(TEXT_PROMPT, promptMsg);

    } else {
      return await stepContext.next(false);
    }
  }

  // Address Search Step
  async secondStep(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Set the movie magic success
    const userInput = stepContext._info.result;

    // DEBUG
    console.log('SECOND STEP - CONFIRM ADDRESS', unblockBotDetails, userInput);

    if(userInput.match("42 Sussex") || userInput === "123" ) {

      // Set messages
      const standardMsg = i18n.__('confirmHomeAddressResultsPromptMsg');
      const promptMsg = standardMsg;
      const promptOptions = i18n.__('confirmHomeAddressResultsPromptOptions');
      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          promptMsg,
        ),
      };
      return await stepContext.prompt(TEXT_PROMPT, promptDetails);

    // Yes please, initiate a callback
    // } else if(userInput === "Yes please!") {
    //   unblockBotDetails.confirmHomeAddressStep = null;
    //   return await stepContext.replaceDialog(
    //     CALLBACK_BOT_DIALOG,
    //     new CallbackBotDetails(),
    //   );

    // Unknown utterance
    } else {

      // Record error and repeat the prompt
      unblockBotDetails.confirmHomeAddressStep = -1;
      unblockBotDetails.errorCount.confirmHomeAddressStep++;
      return await stepContext.replaceDialog(
        CONFIRM_HOME_ADDRESS_STEP,
        unblockBotDetails,
      );
    }

  }

   // Address Search Step
   async thirdStep(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Set the movie magic success
    const userInput = stepContext._info.result?stepContext._info.result:'';

    // DEBUG
    console.log('THIRD STEP - SELECT ADDRESS', unblockBotDetails, 'fake');

    switch (userInput) {
      case "42 Sussex":
      case "42 Sussex Drive":
      case "42 Sussex Drive, Ottawa, ON K1M 1M4":
      case "123":

        // Set the text for the prompt
        const confirm1Msg = i18n.__('confirmHomeAddressConfirm1Msg');
        const confirm2Msg = i18n.__('confirmHomeAddressConfirm2Msg');
        const standardMsg = confirm1Msg + userInput + confirm2Msg;

        // Set messages
        const promptMsg = standardMsg;
        const promptOptions = i18n.__('confirmHomeAddressStepStandardPromptOptions');
        const promptDetails = {
          prompt: ChoiceFactory.forChannel(
            stepContext.context,
            promptOptions,
            promptMsg,
          ),
        };

        return await stepContext.prompt(TEXT_PROMPT, promptDetails);

      // Unknown utterance
      default:

        // Record error and repeat the prompt
        unblockBotDetails.confirmHomeAddressStep = -1;
        unblockBotDetails.errorCount.confirmHomeAddressStep++;
        return await stepContext.replaceDialog(
          CONFIRM_HOME_ADDRESS_STEP,
          unblockBotDetails,
        );

    }
  }

  // Address Save Step
  async fourthStep(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Setup the LUIS app config and languages
    LUISAppSetup(stepContext);

    // Call prompts recognizer
    const recognizerResult = await recognizer.recognize(stepContext.context);

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    // Debug
    console.log('FOURTH STEP - SAVE ADDRESS', unblockBotDetails, intent);

    switch (intent) {
      // Proceed
      case 'promptConfirmYes':
        const confirmHomeAddressSavedFirstMsg = i18n.__('confirmHomeAddressSavedFirstMsg');
        const confirmHomeAddressSavedSecondMsg = i18n.__('confirmHomeAddressSavedSecondMsg');
        const confirmHomeAddressSavedThirdMsg = i18n.__('confirmHomeAddressSavedThirdMsg');

        await stepContext.context.sendActivity(confirmHomeAddressSavedFirstMsg);
        await stepContext.context.sendActivity(confirmHomeAddressSavedSecondMsg);
        await stepContext.context.sendActivity(confirmHomeAddressSavedThirdMsg);

        return await stepContext.endDialog(unblockBotDetails);

      // Don't Proceed
      case 'promptConfirmNo':
        unblockBotDetails.confirmLookIntoStep = null;

        return await stepContext.replaceDialog(
          CONFIRM_HOME_ADDRESS_STEP,
          unblockBotDetails,
        );

      // Unknown utterance
      default: {

        // Record error and repeat the prompt
        unblockBotDetails.confirmHomeAddressStep = -1;
        unblockBotDetails.errorCount.confirmHomeAddressStep++;
        return await stepContext.replaceDialog(
          CONFIRM_HOME_ADDRESS_STEP,
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
    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Setup the LUIS app config and languages
    LUISAppSetup(stepContext);

    // Call prompts recognizer
    const recognizerResult = await recognizer.recognize(stepContext.context);

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    // Debug
    console.log('FINAL STEP - HOME ADDRESS', unblockBotDetails, intent);

    switch (intent) {

      // Proceed
      case 'promptConfirmYes':
      case 'promptConfirmHomeAddressYes':
        unblockBotDetails.confirmHomeAddressStep = true;
        return await stepContext.endDialog(unblockBotDetails);

      // Don't Proceed
      case 'promptConfirmNo':
      case 'promptConfirmHomeAddressNo':
        unblockBotDetails.confirmHomeAddressStep = null;
        return await stepContext.replaceDialog(
          CALLBACK_BOT_DIALOG,
          new CallbackBotDetails(),
        );

      // Unknown utterance
      default: {

        // Record error and repeat the prompt
        unblockBotDetails.confirmHomeAddressStep = -1;
        unblockBotDetails.errorCount.confirmHomeAddressStep++;
        return await stepContext.replaceDialog(
          CONFIRM_HOME_ADDRESS_STEP,
          unblockBotDetails,
        );
      }
    }
  }
}
