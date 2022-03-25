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

import {
  CallbackBotDialog,
  CALLBACK_BOT_DIALOG
} from '../callbackDialogs/callbackBotDialog';
import { CallbackBotDetails } from '../callbackDialogs/callbackBotDetails';
import { UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_STEP } from './unblockDirectDepositMasterErrorStep';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export const NEXT_OPTION_STEP = 'NEXT_OPTION_STEP';
const NEXT_OPTION_WATERFALL_STEP = 'NEXT_OPTION_WATERFALL_STEP';

// Error handling
import { MAX_ERROR_COUNT } from '../../utils';
import { UnblockRecognizer } from './unblockRecognizer';
import { LuisRecognizer } from 'botbuilder-ai';
import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';
import { callbackCard } from '../../cards/callbackCard';
import { AlwaysOnBotDialog, ALWAYS_ON_BOT_DIALOG } from '../alwaysOnDialogs/alwaysOnBotDialog';

export class UnblockNextOptionStep extends ComponentDialog {
  constructor() {
    super(NEXT_OPTION_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
    this.addDialog(new AlwaysOnBotDialog());

    this.addDialog(
      new WaterfallDialog(NEXT_OPTION_WATERFALL_STEP, [
        this.unblockBotNextStepStart.bind(this),
        this.unblockBotNextStepEnd.bind(this)
      ])
    );

    this.initialDialogId = NEXT_OPTION_WATERFALL_STEP;
  }
  async unblockBotNextStepStart(stepContext: any) {
    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Check if the error count is greater than the max threshold
    // Throw the master error flag
    // because  master error already set to send
    if (unblockBotDetails.errorCount.nextOptionStep >= MAX_ERROR_COUNT) {
      unblockBotDetails.masterError = true;
      const errorMsg = i18n.__(`MasterRetryExceededMessage`);
      await adaptiveCard(stepContext, callbackCard(stepContext.context.activity.locale,errorMsg));
      return await stepContext.endDialog(unblockBotDetails);
    }

    // Check the user state to see if unblockBotDetails.confirm_look_into_step is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      unblockBotDetails.nextOptionStep === null ||
      unblockBotDetails.nextOptionStep === -1
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
        unblockBotDetails.nextOptionStep === -1 ? retryMsg : promptMsg;
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
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    switch (intent) {
      // route user to always on bot
      case 'promptConfirmYes':
        unblockBotDetails.nextOptionStep = false;
        const commonPromptValidatorModel = new CommonPromptValidatorModel();
      // call dialog
      return await stepContext.replaceDialog(ALWAYS_ON_BOT_DIALOG, commonPromptValidatorModel);

      // route user to feedback
      case 'promptConfirmNo':
        unblockBotDetails.nextOptionStep = false;

        return await stepContext.endDialog(unblockBotDetails);

      // Could not understand / No intent
      default: {
        unblockBotDetails.nextOptionStep = -1;
        unblockBotDetails.errorCount.nextOptionStep++;

        return await stepContext.replaceDialog(
          NEXT_OPTION_STEP,
          unblockBotDetails
        );
      }
    }
  }
}
