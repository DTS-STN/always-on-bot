import {
  TextPrompt,
  ChoicePrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
  ListStyle
} from 'botbuilder-dialogs';

import i18n from '../locales/i18nConfig';

import {
  whatNumbersToFindSchema,
  howToFindNumbersSchema,
  TwoTextBlock,
  TextBlock,
  adaptiveCard
} from '../../cards';


const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export const CALLBACK_NEXT_OPTION_STEP = 'CALLBACK_NEXT_OPTION_STEP';
const CALLBACK_NEXT_OPTION_WATERFALL_STEP = 'CALLBACK_NEXT_OPTION_WATERFALL_STEP';

// Error handling
import { MAX_ERROR_COUNT } from '../../utils';
import { UnblockRecognizer } from '../unblockDialogs/unblockRecognizer';
import { LuisRecognizer } from 'botbuilder-ai';
import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';
import { callbackCard } from '../../cards/callbackCard';
import { CommonChoiceCheckStep, COMMON_CHOICE_CHECK_STEP } from '../common/commonChoiceCheckStep';
import { AlwaysOnBotDialog, ALWAYS_ON_BOT_DIALOG } from '../alwaysOnDialogs/alwaysOnBotDialog';
import { ContinueAndFeedbackStep, CONTINUE_AND_FEEDBACK_STEP } from '../common/continueAndFeedbackStep';

export class CallbackNextOptionStep extends ComponentDialog {
  constructor() {
    super(CALLBACK_NEXT_OPTION_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
    this.addDialog(new CommonChoiceCheckStep());
    this.addDialog(
      new WaterfallDialog(CALLBACK_NEXT_OPTION_WATERFALL_STEP, [
        this.unblockBotNextStepStart.bind(this),
        this.unblockBotNextStepEnd.bind(this)
      ])
    );

    this.initialDialogId = CALLBACK_NEXT_OPTION_WATERFALL_STEP;
  }
  async unblockBotNextStepStart(stepContext: any) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options;

    // Check if the error count is greater than the max threshold
    // Throw the master error flag
    // because  master error already set to send
    if (callbackBotDetails.errorCount.nextOptionStep >= MAX_ERROR_COUNT) {
      callbackBotDetails.masterError = true;
      const errorMsg = i18n.__(`MasterRetryExceededMessage`);
      await adaptiveCard(stepContext, callbackCard(stepContext.context.activity.locale,errorMsg));
      return await stepContext.endDialog(callbackBotDetails);
    }

    // Check the user state to see if unblockBotDetails.confirm_look_into_step is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      callbackBotDetails.nextOptionStep === null ||
      callbackBotDetails.nextOptionStep === -1
    ) {
      // Set dialog messages
      let promptMsg: any;
      promptMsg = i18n.__('unblockToAlwaysOnBotOrCallbackBotQueryMsg');
      const promptOptions = i18n.__('unblock_lookup_prompt_confirm_opts');
      const retryMsg = i18n.__(
        'unblockToAlwaysOnBotOrCallbackBotQueryRetryMsg'
      );

      // Setup the prompt
      const promptText =
      callbackBotDetails.nextOptionStep === -1 ? retryMsg : promptMsg;
      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          promptText
        ),
        style: ListStyle.suggestedAction
      };

      return await stepContext.prompt(TEXT_PROMPT, promptDetails);
    } else {
      return await stepContext.next(false);
    }
  }

  async unblockBotNextStepEnd(stepContext: any) {
    const callbackBotDetails = stepContext.options;

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
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    switch (intent) {
      // route user to always on bot
      case 'promptConfirmYes':
      return await stepContext.replaceDialog(ALWAYS_ON_BOT_DIALOG, null);

      // route user to feedback
      case 'promptConfirmNo':

        return await stepContext.endDialog(callbackBotDetails);

      // Could not understand / No intent
      default: {
        callbackBotDetails.nextOptionStep = -1;
        callbackBotDetails.errorCount.nextOptionStep++;

        return await stepContext.replaceDialog(
          CALLBACK_NEXT_OPTION_STEP,
          callbackBotDetails
        );
      }
    }
  }
}
