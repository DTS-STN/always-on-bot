
import { MessageFactory } from 'botbuilder';
import { ComponentDialog, TextPrompt, WaterfallDialog } from 'botbuilder-dialogs';
import { DialogTestClient, DialogTestLogger } from 'botbuilder-testing';
import { MainDialog } from '../../dialogs/mainDialog';
import  i18n  from "../../dialogs/locales/i18nConfig";
const assert = require('assert');
import { expect } from 'chai';
/**
 * An waterfall dialog derived from MainDialog for testing
 */


describe('MainDialog', () => {
    describe('Should be able to initial callback dialog', () => {
       // const testCases = require('./testData/MainDialogTestData');
        const sut = new MainDialog();
      // Create array with test case data.
      const standardMsg = i18n.__("confirmSendEmailStepStandardMsg");
      const firstMsg = i18n.__("unBlockBotDialogWelcomeMsg");
      const secondMsg = i18n.__("confirmLookIntoStepStandardMsg");
      const leaveMsg = i18n.__("confirmCallbackStepCloseMsg");
      const testCases = [
        { utterance: 'Yes, please', intent: 'go to unblock dialog', invokedDialogResponse: 'mainDialog mock invoked', taskConfirmationMessage: standardMsg },
        { utterance: 'No,thanks', intent: 'Leave the dialog', invokedDialogResponse: ``, taskConfirmationMessage: leaveMsg }
    ];
        testCases.map((testData) => {
            it(testData.intent, async () => {

                const client = new DialogTestClient('test', sut, null, [new DialogTestLogger()]);

                // Execute the test case
                // console.log('test 2',client.conversationState)
               // console.log('test 3',client.dialogTurnResult.result)
               let reply = await client.sendActivity('');
             //  let newUpdateReply = client.getNextReply();
             expect(reply.text).to.be.equal( firstMsg);


              //  console.log('test 3',newUpdateReply)
                // reply = await client.sendActivity(testData.utterance);
                let secondReply = client.getNextReply();
                expect(secondReply.text).to.be.equal(secondMsg+" (1) Yes please! or (2) No thanks");
              let realReply = await client.sendActivity(testData.utterance);
               // let nextReply = client.getNextReply()
              //  console.log('test 2',reply)

                 expect(realReply.text).to.be.equal('testData.taskConfirmationMessagte');
                //assert.strictEqual(client.dialogTurnResult.status, 'waiting');

               // reply = await client.sendActivity(testData.invokedDialogResponse);
             //   assert.strictEqual(reply.text, 'Cancelling...');
             //   assert.strictEqual(client.dialogTurnResult.status, 'complete');
            });
        });
    });

    describe('Should be able to get rate step', () => {
        const leaveMsg = i18n.__("confirmCallbackStepCloseMsg");
        const testCases = [
            { utterance: 'No,thanks', intent: 'Leave the dialog', invokedDialogResponse: ``, taskConfirmationMessage: leaveMsg }
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