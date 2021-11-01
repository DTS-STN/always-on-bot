
/*
import { MessageFactory } from 'botbuilder';
import { ComponentDialog, TextPrompt, WaterfallDialog } from 'botbuilder-dialogs';
import { DialogTestClient, DialogTestLogger } from 'botbuilder-testing';
import { CallbackBotDialog } from '../../dialogs/callbackBotDialog';
const assert = require('assert');
*/
/**
 * An waterfall dialog derived from CancelAndHelpDialog for testing
 */
/*
class TestCallbackBotDialog extends CallbackBotDialog {
    constructor() {
        super( 'TestCallbackBotDialog');

        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(new WaterfallDialog('WaterfallDialog', [
                this.promptStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = 'WaterfallDialog';
    }

    public async promptStep(stepContext) {
        return await stepContext.prompt('TextPrompt', { prompt: MessageFactory.text('Hi there') });
    }

    public async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

describe('CallbackDialog', () => {
    describe('Should be able to call greeting step', () => {
        const testCases = ['cancel', 'quit'];

        testCases.map((testData) => {
            it(testData, async () => {
                const sut = new TestCallbackBotDialog();
                const client = new DialogTestClient('test', sut, null, [new DialogTestLogger()]);

                // Execute the test case
                let reply = await client.sendActivity('Hi');
                assert.strictEqual(reply.text, 'Hi there');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');

                reply = await client.sendActivity(testData);
                assert.strictEqual(reply.text, 'Cancelling...');
                assert.strictEqual(client.dialogTurnResult.status, 'complete');
            });
        });
    });

    describe('Should be able to get phone number step', () => {
        const testCases = ['help', '?'];

        testCases.map((testData) => {
            it(testData, async () => {
                const sut = new TestCallbackBotDialog();
                const client = new DialogTestClient('test', sut, null, [new DialogTestLogger()]);

                // Execute the test case
                let reply = await client.sendActivity('Hi');
                assert.strictEqual(reply.text, 'Hi there');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');

                reply = await client.sendActivity(testData);
                assert.strictEqual(reply.text, 'Show help here');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');
            });
        });
    });
    describe('Should be able to get date and time step', () => {
        const testCases = ['help', '?'];

        testCases.map((testData) => {
            it(testData, async () => {
                const sut = new TestCallbackBotDialog();
                const client = new DialogTestClient('test', sut, null, [new DialogTestLogger()]);

                // Execute the test case
                let reply = await client.sendActivity('Hi');
                assert.strictEqual(reply.text, 'Hi there');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');

                reply = await client.sendActivity(testData);
                assert.strictEqual(reply.text, 'Show help here');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');
            });
        });
    });

    describe('Should be able to get confirm auth word step', () => {
        const testCases = ['help', '?'];

        testCases.map((testData) => {
            it(testData, async () => {
                const sut = new TestCallbackBotDialog();
                const client = new DialogTestClient('test', sut, null, [new DialogTestLogger()]);

                // Execute the test case
                let reply = await client.sendActivity('Hi');
                assert.strictEqual(reply.text, 'Hi there');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');

                reply = await client.sendActivity(testData);
                assert.strictEqual(reply.text, 'Show help here');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');
            });
        });
    });

    describe('Should be able to get confirm details step', () => {
        const testCases = ['help', '?'];

        testCases.map((testData) => {
            it(testData, async () => {
                const sut = new TestCallbackBotDialog();
                const client = new DialogTestClient('test', sut, null, [new DialogTestLogger()]);

                // Execute the test case
                let reply = await client.sendActivity('Hi');
                assert.strictEqual(reply.text, 'Hi there');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');

                reply = await client.sendActivity(testData);
                assert.strictEqual(reply.text, 'Show help here');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');
            });
        });
    });
});
*/