import { LuisRecognizer } from 'botbuilder-ai';
import {
  TextPrompt,
  ComponentDialog,
  WaterfallDialog,
  WaterfallStepContext,
  ChoiceFactory,
  ListStyle,
  ChoicePrompt
} from 'botbuilder-dialogs';
import { CallbackBotDetails } from './callbackBotDetails';
import { CallbackRecognizer } from './callbackRecognizer';
import { GET_PREFERRED_METHOD_OF_CONTACT_STEP } from './getPreferredMethodOfContactStep';
import validatePhoneNumber from '../../utils/validateCanadianPhoneNumber';
import i18n from '../locales/i18nConfig';

const TEXT_PROMPT = 'TEXT_PROMPT';
export const GET_USER_PHONE_NUMBER_STEP = 'GET_USER_PHONE_NUMBER_STEP';
const GET_USER_PHONE_NUMBER_WATERFALL_STEP =
  'GET_USER_PHONE_NUMBER_WATERFALL_STEP';

import { MAX_ERROR_COUNT}  from '../../utils'
import { adaptiveCard } from '../../cards';
import { callbackCard } from '../../cards/callbackCard';
import { CALLBACK_NEXT_OPTION_STEP } from './callbackNext';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export class GetUserPhoneNumberStep extends ComponentDialog {
  constructor() {
    super(GET_USER_PHONE_NUMBER_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT))

    this.addDialog(
      new WaterfallDialog(GET_USER_PHONE_NUMBER_WATERFALL_STEP, [
        this.initialStep.bind(this),
        this.finalStep.bind(this)
      ])
    );

    this.initialDialogId = GET_USER_PHONE_NUMBER_WATERFALL_STEP;
  }

  /**
   * Kick off the dialog by asking for a new phone number
   *
   */
  async initialStep(stepContext: WaterfallStepContext) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options as CallbackBotDetails;

    // Set the text for the prompt
    let standardMsg;
    if (callbackBotDetails.confirmCallbackPhoneNumberStep === false) {
      standardMsg = i18n.__('getCallbackPhoneNumberStandardMsg');
    } else standardMsg = i18n.__('getUserPhoneStepStandardMsg');

    // Set the text for the retry prompt
    const retryMsg = i18n.__('getUserPhoneNumberFormatErrorMsg');

    // Check if the error count is greater than the max threshold
    if (
      callbackBotDetails.errorCount.getUserPhoneNumberStep >= MAX_ERROR_COUNT
    ) {
      if (callbackBotDetails.confirmCallbackPhoneNumberStep === false) {
        //   Throw the master error flag
        callbackBotDetails.masterError = true;
        //  Send master error message
        // Set master error message to send
        const errorMsg = i18n.__(`MasterRetryExceededMessage`);
      await adaptiveCard(stepContext, callbackCard(stepContext.context.activity.locale,errorMsg));
        // End the dialog and pass the updated details state machine
        return await stepContext.endDialog(callbackBotDetails);
      } else {
        const errorMsg = i18n.__('phoneNumberFormatMaxErrorMsg');

        const promptOptions = i18n.__('confirmEmailStepErrorPromptOptions');
        return await stepContext.prompt(CHOICE_PROMPT, {
          prompt: errorMsg,
          choices: ChoiceFactory.toChoices(promptOptions),
          style: ListStyle.suggestedAction
      });
      }
    }

    // Check the user state to see if callbackBotDetails.getUserPhoneNumberStep is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      (callbackBotDetails.getUserPhoneNumberStep === null ||
        callbackBotDetails.getUserPhoneNumberStep === -1) &&
      ((typeof callbackBotDetails.confirmPhoneStep === 'boolean' &&
        callbackBotDetails.confirmPhoneStep === false) ||
        (typeof callbackBotDetails.confirmCallbackPhoneNumberStep ===
          'boolean' &&
          callbackBotDetails.confirmCallbackPhoneNumberStep === false))
    ) {
      // Setup the prompt message
      let promptMsg = '';

      // The current step is an error state
      if (callbackBotDetails.getUserPhoneNumberStep === -1) {
        promptMsg = retryMsg;
      } else {
        promptMsg = standardMsg;
      }

      return await stepContext.prompt(TEXT_PROMPT, promptMsg);
    } else {
      return await stepContext.next(false);
    }
  }

  async finalStep(stepContext: WaterfallStepContext<CallbackBotDetails>) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options;
    let luisRecognizer;
    let lang = 'en';
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
    const reRefactorRes = await luisRecognizer.executeLuisQuery(
      stepContext.context
    );

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(reRefactorRes, 'None', 0.5);

    switch (intent) {
      // Proceed
      case 'promptConfirmChoiceText':
      case 'promptConfirmYes':
      case 'promptTryAgainYes':
        callbackBotDetails.getPreferredMethodOfContactStep = null;
        callbackBotDetails.confirmPhoneStep = null;
        callbackBotDetails.getUserPhoneNumberStep = null;
        callbackBotDetails.preferredEmailAndText = null;
        callbackBotDetails.preferredText = null;
        callbackBotDetails.errorCount.getUserPhoneNumberStep = 0;
        return await stepContext.replaceDialog(
          GET_PREFERRED_METHOD_OF_CONTACT_STEP,
          callbackBotDetails
        );
      case 'promptConfirmNo':
      case 'NoNotForNow':

        // call next option dialog
        return await stepContext.replaceDialog(CALLBACK_NEXT_OPTION_STEP, callbackBotDetails);

      // Could not understand / None intent
      default: {
        // Catch all
        const results = stepContext.result;
        if (results) {
          // phone number validation

          const  validPhoneNumber  = validatePhoneNumber(results)
          if (validPhoneNumber) {
            const confirmMsg = i18n.__('getUserPhoneConfirmMsg');
            callbackBotDetails.confirmPhoneStep = true;
            callbackBotDetails.getUserPhoneNumberStep = true;
            if (callbackBotDetails.confirmCallbackPhoneNumberStep === true) {
              await stepContext.context.sendActivity(confirmMsg);
            }
            if (callbackBotDetails.confirmCallbackPhoneNumberStep === false) {
              callbackBotDetails.confirmCallbackPhoneNumberStep = true;
              const firstWelcomeMsg = i18n.__('getCallbackScheduleStandardMsg');
              const standardMsgContinue = i18n.__('confirmAuthStepMsg');
              const confirmationCodeMsg = i18n.__(
                'confirmAuthWordStepStandardMsg'
              );
              await stepContext.context.sendActivity(firstWelcomeMsg);
              await stepContext.context.sendActivity(standardMsgContinue);
              await stepContext.context.sendActivity(confirmationCodeMsg);
            }

            return await stepContext.endDialog(callbackBotDetails);
          } else {
            callbackBotDetails.getUserPhoneNumberStep = -1;
            callbackBotDetails.errorCount.getUserPhoneNumberStep++;
          }
        }

        return await stepContext.replaceDialog(
          GET_USER_PHONE_NUMBER_STEP,
          callbackBotDetails
        );
      }
    }
  }
}
