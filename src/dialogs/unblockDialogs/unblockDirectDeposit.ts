import {
  TextPrompt,
  ChoicePrompt,
  ComponentDialog,
  WaterfallDialog
} from 'botbuilder-dialogs';
import { MessageFactory, CardFactory } from 'botbuilder';
import i18n from '../locales/i18nConfig';
import { CallbackBotDialog, CALLBACK_BOT_DIALOG } from '../callbackBotDialog';
import { CallbackBotDetails } from '../callbackBotDetails';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export const CONFIRM_DIRECT_DEPOSIT_STEP = 'CONFIRM_DIRECT_DEPOSIT_STEP';
const CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP = 'CONFIRM_DIRECT_DEPOSIT_STEP';

// Error handling
const MAX_ERROR_COUNT = 3;
const ACCOUNT = false;
let INSTITUTE = false
let TRANSIT = false;

// WIP: EXPERIMENTING WITH ADAPTIVE CARDS IN START STEP, REMOVE LATER
const CARD_DEBUG = null;

export class UnblockDirectDepositStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_DIRECT_DEPOSIT_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP, [
        this.unblockDirectDepositStart.bind(this),
        this.unblockBankInstitute.bind(this),
        this.unblockDirectDepositEnd.bind(this)
      ])
    );

    this.initialDialogId = CONFIRM_DIRECT_DEPOSIT_WATERFALL_STEP;
  }

  /**
   * Initial step in the waterfall. This will kick of the UnblockDirectDepositStep step
   */
  async unblockDirectDepositStart(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;

    // Check if the error count is greater than the max threshold
    if (unblockBotDetails.errorCount.unblockDirectDeposit >= MAX_ERROR_COUNT) {

      unblockBotDetails.masterError = true;
      unblockBotDetails.unblockDirectDeposit = -1;

      return await stepContext.replaceDialog(
        CALLBACK_BOT_DIALOG,
        new CallbackBotDetails()
      );
    }

    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    // If it is 0, we hvae some direct deposit info but not all of it
    if (
      unblockBotDetails.unblockDirectDeposit === null ||
      unblockBotDetails.unblockDirectDeposit === -1 ||
      unblockBotDetails.unblockDirectDeposit === 0
    ) {

      // Set dialog messages
      const standardMsg       = i18n.__('unblock_direct_deposit_msg');
      const infoMsg           = i18n.__('unblock_direct_deposit_how_to');
      const listOfItems       = i18n.__('unblock_direct_deposit_prompt_opts');
      let promptMsg           = '';
      let retryMsg            = '';

      // If first pass through, show welcome messaging
      if(unblockBotDetails.unblockDirectDeposit === null) {
        await stepContext.context.sendActivity(standardMsg);
        await stepContext.context.sendActivity(listOfItems);
        await stepContext.context.sendActivity(infoMsg);
      }

      // State of unblock direct deposit determines message prompts
      if(TRANSIT === true) { // ACCOUNT
        promptMsg = i18n.__('unblock_direct_deposit_account');
        retryMsg= i18n.__('unblock_direct_deposit_account_retry');

        if(unblockBotDetails.unblockDirectDeposit === -1) {
          await stepContext.context.sendActivity(retryMsg)
        }

      } else if(INSTITUTE === true) { // TRANSIT
        promptMsg = i18n.__('unblock_direct_deposit_transit');
        retryMsg= i18n.__('unblock_direct_deposit_transit_retry');

        if(unblockBotDetails.unblockDirectDeposit === -1) {
          await stepContext.context.sendActivity(retryMsg);
        }

      } else { // INSTITUTE
        promptMsg =  i18n.__('unblock_direct_deposit_institute');
        retryMsg = i18n.__('unblock_direct_deposit_institute_retry');

        if(unblockBotDetails.unblockDirectDeposit === -1) {
          await stepContext.context.sendActivity(retryMsg);
        }

      }

      if(CARD_DEBUG === true) {
        // In practice you'll probably get this from a service
        // see http://adaptivecards.io/samples/ for inspiration
        const adaptiveCardData = {
         '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
         'type': 'AdaptiveCard',
          'version': '1.0',
          'body': [
           {
             'type': 'TextBlock',
             'text': `${standardMsg}`,
             'wrap': true
           },
           {'type': 'FactSet',
             'facts': [
               {
                 'title': '1',
                 'value': 'Institution Number'
               },
               {
                 'title': '2',
                 'value': 'Transit Number'
               },
               {
                 'title': '3',
                 'value': 'Account Number'
               }
             ]
           },
           {
             'type': 'TextBlock',
             'text': `${infoMsg}`,
             'wrap': true
           },
           {
             'type': 'Input.Text',
             'label': 'Institution number',
             'maxLength': 3,
             'placeholder' : 'Enter your 3 digit institution number',
             'id': 'instituteNumber',
             'errorMessage': 'We need a valid institution number',
             'regex' : '^[0-9]{3}$',
             'isRequired': true
           },
           {
             'label': 'Transit Number',
             'type': 'Input.Text',
             'maxLength': 5,
             'id': 'transitNumber',
             'placeholder' : 'Enter your 5 digit transit number',
             'errorMessage': 'We need a valid transit number',
             'regex' : '^[0-9]{5}$',
             'isRequired': true
           },
           {
             'type': 'Input.Text',
             'label': 'Account number',
             'maxLength': 7,
             'id': 'accountNumber',
             'placeholder' : 'Enter your 7 digit account number',
             'errorMessage': 'We need a valid account number',
             'regex' : '^[0-9]{7}$',
             'isRequired': true
           }
         ],
         'actions': [
           {
             'type': 'Action.Submit',
             'title': 'Submit my bank information',
             'data': {
               'id': '1234567890'
             }
           },
           {
             'type': 'Action.ShowCard',
             'title': 'Where do I find these numbers?',
             'tooltip' : 'Click here to see where the numbers are',
             'card': {
               'type': 'AdaptiveCard',
               'body': [
                 {
                   'type': 'TextBlock',
                   'text': 'Here is the location of the numbers we were telling you about'
                 },
                 {
                   'type': 'Image',
                   'url': 'https://adaptivecards.io/content/cats/1.png'
                 }
               ]
             }
           }
         ]
       };

       const card = CardFactory.adaptiveCard(adaptiveCardData);
       const message = MessageFactory.attachment(card);
       await stepContext.context.sendActivity(message);

      } else {

         // If first pass through, show welcome messaging
       if(unblockBotDetails.unblockDirectDeposit === null) {

         let card:any;
         let message:any;

         const standardMsgSchema = {
           '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
           'type': 'AdaptiveCard',
            'version': '1.0',
            'body': [
             {
               'type': 'TextBlock',
               'text': `${standardMsg}`,
               'wrap': true,
               'fontType': 'default'
             },
             {'type': 'FactSet',
               'facts': [
                 {
                   'title': '1',
                   'value': 'Institution Number'
                 },
                 {
                   'title': '2',
                   'value': 'Transit Number'
                 },
                 {
                   'title': '3',
                   'value': 'Account Number'
                 }
               ]
             }
           ]
         };

         const infoMsgSchema = {
           '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
           'type': 'AdaptiveCard',
            'version': '1.0',
            'body': [
             {
               'type': 'TextBlock',
               'text': `${infoMsg}`,
               'wrap': true
             },
             {
               'type': 'Image',
               'url': 'https://www.canada.ca/content/canadasite/en/revenue-agency/services/e-services/e-services-individuals/account-individuals/manage-direct-deposit/_jcr_content/par/img_0_0/image.img.gif/1511363454177.gif'
             }
           ]
         };

         card = CardFactory.adaptiveCard(standardMsgSchema);
         message = MessageFactory.attachment(card);
         await stepContext.context.sendActivity(message);

         card = CardFactory.adaptiveCard(infoMsgSchema);
         message = MessageFactory.attachment(card);
         await stepContext.context.sendActivity(message);
       }

     }

       // Prompt the user to enter their bank information
       return await stepContext.prompt(TEXT_PROMPT, { prompt: promptMsg });


    } else {
      return await stepContext.next(false);
    }
  }

  /**
   * Offer to have a Service Canada Officer contact them
   */
  async unblockBankInstitute(stepContext) {

    // Get the user details / state machine
    const unblockBotDetails = stepContext.options;
    const userInput = stepContext._info ? stepContext._info.result : null;

    // Validate numeric input
    let numLength = 0;
    if(TRANSIT === true) { // Account
      numLength = 7;
    } else if(INSTITUTE === true) { // Transit
      numLength = 5;
    } else { // Institute
      numLength = 3;
    }
    const numberRegex = /^\d+$/;
    const validNumber = numberRegex.test(userInput);

    // If valid number matches requested value lenght
    if (validNumber && userInput.length === numLength && INSTITUTE === false) {
      INSTITUTE = true;
      unblockBotDetails.unblockDirectDeposit = 0;
      unblockBotDetails.errorCount.unblockDirectDeposit = 0;
    } else if (validNumber && userInput.length === numLength && TRANSIT === false) {
      TRANSIT = true;
      unblockBotDetails.unblockDirectDeposit = 0;
      unblockBotDetails.errorCount.unblockDirectDeposit = 0;
    } else if (validNumber && userInput.length === numLength && INSTITUTE === true && TRANSIT === true && ACCOUNT === false) {
      unblockBotDetails.unblockDirectDeposit = true; // Proceed
      TRANSIT = false; // Reset
      INSTITUTE = false; // Reset
    } else {
      unblockBotDetails.unblockDirectDeposit = -1;
      unblockBotDetails.errorCount.unblockDirectDeposit++;
    }

    // Next step for pass, or repeat as needed
    if(unblockBotDetails.unblockDirectDeposit === true) {
      return await stepContext.next(unblockBotDetails);
    } else {
      return await stepContext.replaceDialog(
        CONFIRM_DIRECT_DEPOSIT_STEP,
        unblockBotDetails
      );
    }
  }

  /**
   * Final message prompt
   */
  async unblockDirectDepositEnd(stepContext) {

    // Get the results of the last ran step
    const unblockBotDetails = stepContext.result;

    const validMsg = i18n.__('unblock_direct_deposit_valid_msg');
    const validTip = i18n.__('unblock_direct_deposit_valid_tip');
    const validReminder = i18n.__('unblock_direct_deposit_valid_reminder');

    await stepContext.context.sendActivity(validMsg);
    await stepContext.context.sendActivity(validTip);
    await stepContext.context.sendActivity(validReminder);

    return await stepContext.endDialog(unblockBotDetails);
  }
}
