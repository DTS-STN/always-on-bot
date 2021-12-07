
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
describe('MainDialog', () => {
    describe('Should initialize the main bot dialog', () => {

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
        it(`Should initialize the main dialog with locale ${testData.initialData.locale}`, async () => {
          const client = new DialogTestClient('test', sut, testData.initialData, [
            new DialogTestLogger()
          ]);

          // Execute the test case
          const updatedActivity: Partial<Activity> = {
            locale: 'en'
          };
          const reply = await client.sendActivity(updatedActivity);
          expect(reply.locale).to.be.equal(testData.initialData.locale);
        });

        it(`Should set the unblockBot details object`, async () => {
            const client = new DialogTestClient('test', sut, testData.initialData, [
              new DialogTestLogger()
            ]);

            // Execute the test case
            // const updatedActivity: Partial<Activity> = {
            //     locale: 'en'
            // };

            // const reply = await client.sendActivity(updatedActivity);
            // expect(reply.locale).to.be.equal(testData.initialData.locale);
          });
      });
    });

    describe('Should be able to get rate step', () => {
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