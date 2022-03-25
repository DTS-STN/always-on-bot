import {
  TextPrompt,
  ChoicePrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
  PromptValidatorContext,
  Choice,
  ListStyle
} from 'botbuilder-dialogs';

import { LuisRecognizer } from 'botbuilder-ai';

import i18n from '../locales/i18nConfig';
import { adaptiveCard, TextBlock, TextBlockWithLink } from '../../cards';
import { UnblockRecognizer } from './unblockRecognizer';
import { CALLBACK_BOT_DIALOG } from '../callbackDialogs/callbackBotDialog';
import { CallbackBotDetails } from '../callbackDialogs/callbackBotDetails';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export const UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_STEP =
  'UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_STEP';
const UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_WATERFALL_STEP =
  'UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_WATERFALL_STEP';
import { MAX_ERROR_COUNT}  from '../../utils'
import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';
import { AlwaysOnBotDialog, ALWAYS_ON_BOT_DIALOG } from '../alwaysOnDialogs/alwaysOnBotDialog';
import { NEXT_OPTION_STEP } from './unblockNext';
import { callbackCard } from '../../cards/callbackCard';

export class UnblockDirectDepositMasterErrorStep extends ComponentDialog {
  constructor() {
    super(UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator));
    this.addDialog(new AlwaysOnBotDialog());
    this.addDialog(
      new WaterfallDialog(UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_WATERFALL_STEP, [
        this.unblockMasterErrorProcessStart.bind(this),
        this.unblockMasterErrorProcessEnd.bind(this)
      ])
    );

    this.initialDialogId = UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_WATERFALL_STEP;
  }

  private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
    return true;
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
  async unblockMasterErrorProcessStart(stepContext: any) {
    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Check if the error count is greater than the max threshold
    // Throw the master error flag
    // because  master error already set to send
    if (
      unblockBotDetails.errorCount.directDepositErrorStep >= MAX_ERROR_COUNT
    ) {
      unblockBotDetails.masterError = true;
      const errorMsg = i18n.__('unblockBotDialogMasterErrorMsg');
      await adaptiveCard(stepContext, callbackCard(stepContext.context.activity.locale,errorMsg));
      return await stepContext.endDialog(unblockBotDetails);
    }

    // Check the user state to see if unblockBotDetails.confirm_look_into_step is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      unblockBotDetails.directDepositMasterError === null ||
      unblockBotDetails.directDepositMasterError === -1
    ) {
      // Set dialog messages
      let promptMsg: any;
      const cardMessage = null;
      const promptOptions = i18n.__('directDepositMasterErrorPromptRetryOpts');
      const retryMsg = i18n.__('confirmCallbackStepRetryMsg');

      promptMsg = i18n.__('directDepositMasterErrorMsg');

      // Setup the prompt
      const promptText =
        unblockBotDetails.directDepositMasterError === -1 ? retryMsg : promptMsg;

      return await stepContext.prompt(CHOICE_PROMPT, {
        prompt: promptText,
        choices: ChoiceFactory.toChoices(promptOptions),
        style: ListStyle.suggestedAction
    });

    } else {
      return await stepContext.next(false);
    }
  }

  /**
   * Offer to have a Service Canada Officer contact them
   */
  async unblockMasterErrorProcessEnd(stepContext: any) {
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
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    switch (intent) {
      // route user to callback bot
      case 'promptConfirmYes':
      case 'YesIWantToRequestCall':
      case 'promptConfirmCallbackYes':
        unblockBotDetails.directDepositErrorStep = true;

        const callbackErrorCause = new CallbackBotDetails();
        callbackErrorCause.directDepositError = true;
        // go to call back bot step
        return await stepContext.replaceDialog(
          CALLBACK_BOT_DIALOG,
          callbackErrorCause
        );

      // route user to always on bot
      case 'NoNotForNow':
        unblockBotDetails.directDepositMasterError = false;

        // const commonPromptValidatorModel = new CommonPromptValidatorModel();
        return await stepContext.replaceDialog( NEXT_OPTION_STEP,unblockBotDetails);
        // call dialog
       // return await stepContext.replaceDialog(ALWAYS_ON_BOT_DIALOG, null);
      // Could not understand / No intent
      default: {
        unblockBotDetails.directDepositMasterError = -1;
        unblockBotDetails.errorCount.directDepositErrorStep++;

        return await stepContext.replaceDialog(
          UNBLOCK_DIRECT_DEPOSIT_MASTER_ERROR_STEP,
          unblockBotDetails
        );
      }
    }
  }
}
