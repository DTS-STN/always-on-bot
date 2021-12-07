
import { Activity, MessageFactory } from 'botbuilder';

import {
  ComponentDialog,
  TextPrompt,
  WaterfallDialog,
  WaterfallStepContext
} from 'botbuilder-dialogs';

import { DialogTestClient, DialogTestLogger } from 'botbuilder-testing';
import { MainDialog } from '../../dialogs/mainDialog';
import i18n from '../../dialogs/locales/i18nConfig';
import assert from 'assert';
import chai from 'chai';
import * as tsSinon from 'ts-sinon';
import {
  UnblockBotDialog,
  UNBLOCK_BOT_DIALOG
} from '../../dialogs/unblockDialogs/unblockBotDialog';

chai.use(require('sinon-chai'));
import { expect } from 'chai';
import { CallbackRecognizer } from '../../dialogs/calllbackDialogs/callbackRecognizer';
import { ConfirmLookIntoStep } from '../../dialogs/unblockDialogs/unblockLookup';

/**
 * An waterfall dialog derived from MainDialog for testing
 */
describe('Unblock Lookup Step', () => {
    describe('Should initialize the unblock bot dialog', () => {

        const sut = new MainDialog();
        const unblockBotDialog = new UnblockBotDialog();

        const confirmLookInto = new ConfirmLookIntoStep();
        sut.addDialog(unblockBotDialog);
        unblockBotDialog.addDialog(confirmLookInto);
        afterEach(() => {
            tsSinon.default.restore();
        });

        // Create array with test case data.
        const testCases = [
        {
          initialData: {
            locale: 'en',
            masterError: 'null',
            confirmLookIntoStep: null,
            unblockDirectDeposit: null,
            errorCount : {
              confirmLookIntoStep: 0,
              unblockDirectDeposit: 0
            }
          }
        }
      ];

      testCases.map((testData) => {
        it(`Should show the lookup welcome messages and prompt`, async () => {

          const client = new DialogTestClient('welcome', sut, testData.initialData, [
            new DialogTestLogger()
          ]);

          const welcomeMsg = i18n.__('unblock_lookup_welcome_msg');
          const updateMsg = i18n.__('unblock_lookup_update_msg');
          const reasonMsg = i18n.__('unblock_lookup_update_reason');
          const promptMsg = i18n.__('unblock_lookup_update_prompt_msg');

          // welcomeMsg
          const updatedActivity: Partial<Activity> = {
            text: 'I need to update your information in order to get you ready to receive your first payment on time. Do you have a bank account with a Canadian financial institution? (1) Yes, thank you or (2) No thanks'
          };

          const reply = await client.sendActivity(updatedActivity);
          expect(reply.text).to.be.equal(promptMsg);

          assert.strictEqual(reply.text, 'Show help here');

        });

      });
    });

    describe('Should ask a user who declines the lookup to confirm their intent', () => {
        const leaveMsg = i18n.__('confirmCallbackStepCloseMsg');
        const testCases = [
            { utterance: 'No,thanks', intent: 'Should leave the dialog', invokedDialogResponse: ``, taskConfirmationMessage: leaveMsg }
        ];

        testCases.map((testData) => {
            it(testData.intent, async () => {
                const sut = new MainDialog();
                const client = new DialogTestClient('test', sut, null, [new DialogTestLogger()]);

                // Execute the test case
                let reply = await client.sendActivity('Yes Please!');
                assert.strictEqual(reply.text, 'Hi there');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');

                reply = await client.sendActivity(testData.utterance);
                assert.strictEqual(reply.text, 'Show help here');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');
            });
        });
    });

    describe('Should send a positive intent to the DirectDepositDialog', () => {
      const leaveMsg = i18n.__('confirmCallbackStepCloseMsg');
      const testCases = [
          { utterance: 'No,thanks', intent: 'Should leave the dialog', invokedDialogResponse: ``, taskConfirmationMessage: leaveMsg }
      ];

      testCases.map((testData) => {
          it(testData.intent, async () => {
              const sut = new MainDialog();
              const client = new DialogTestClient('test', sut, null, [new DialogTestLogger()]);

              // Execute the test case
              let reply = await client.sendActivity('Yes Please!');
              assert.strictEqual(reply.text, 'Hi there');
              assert.strictEqual(client.dialogTurnResult.status, 'waiting');

              reply = await client.sendActivity(testData.utterance);
              assert.strictEqual(reply.text, 'Show help here');
              assert.strictEqual(client.dialogTurnResult.status, 'waiting');
          });
      });
    });

    describe('Should send a negative intent to a link for more information and ask for feedback', () => {
      const leaveMsg = i18n.__('confirmCallbackStepCloseMsg');
      const testCases = [
          { utterance: 'No,thanks', intent: 'Should leave the dialog', invokedDialogResponse: ``, taskConfirmationMessage: leaveMsg }
      ];

      testCases.map((testData) => {
          it(testData.intent, async () => {
              const sut = new MainDialog();
              const client = new DialogTestClient('test', sut, null, [new DialogTestLogger()]);

              // Execute the test case
              let reply = await client.sendActivity('Yes Please!');
              assert.strictEqual(reply.text, 'Hi there');
              assert.strictEqual(client.dialogTurnResult.status, 'waiting');

              reply = await client.sendActivity(testData.utterance);
              assert.strictEqual(reply.text, 'Show help here');
              assert.strictEqual(client.dialogTurnResult.status, 'waiting');
          });
      });
    });

});