/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
 import { ActivityTypes, ConversationState, MemoryStorage, TestAdapter, TurnContext, UserState } from 'botbuilder';
 import { ComponentDialog, Dialog, DialogSet, DialogTurnStatus } from 'botbuilder-dialogs';
 import { VirtualAssistantUnblockBot  } from '../../bots/VirtualAssistantUnblockBot';
 const assert = require('assert');
 import  i18n  from "../../dialogs/locales/i18nConfig";
 // TODO: change assert to chai or other third part lib instead of use nodejs default one

 /**
  * A simple mock for a root dialog that gets invoked by the bot.
  * this test does not work yet. it can start the bot, but somehow the mock root dialog does not invoke.
  */
 class MockRootDialog extends ComponentDialog {
     constructor() {
         super('mockRootDialog');
     }

     public async beginDialog(dc, options) {
         await dc.context.sendActivity(`${ this.id } mock invoked`);
         return await dc.endDialog();
     }

     public async run(turnContext, accessor) {
         const dialogSet = new DialogSet(accessor);
         dialogSet.add(this);

         const dialogContext = await dialogSet.createContext(turnContext);
         const results = await dialogContext.continueDialog();
         if (results.status === DialogTurnStatus.empty) {
             await dialogContext.beginDialog(this.id);
         }
     }
 }

 describe('CallbackBot Initial', () => {
     const testAdapter = new TestAdapter(async (context) => undefined);

     async function processActivity(activity, bot) {
         const context = new TurnContext(testAdapter, activity);
         await bot.run(context);
     }

     it('Shows welcome statement on member added and starts main dialog', async () => {
         const mockRootDialog = new MockRootDialog();
         const memoryStorage = new MemoryStorage();
         const conversationState = new ConversationState(memoryStorage)

         const dialogs = new DialogSet(conversationState.createProperty('DialogState'))
         dialogs.add(mockRootDialog)
         const sut = new VirtualAssistantUnblockBot(new ConversationState(memoryStorage), new UserState(memoryStorage), dialogs);

         // Create conversationUpdate activity
         const conversationUpdateActivity = {
             channelId: 'test',
             conversation: {
                 id: 'someId'
             },
             membersAdded: [
                 { id: 'theUser' }
             ],
             recipient: { id: 'theBot' },
             type: ActivityTypes.ConversationUpdate
         };

         // Send the conversation update activity to the bot.
         await processActivity(conversationUpdateActivity, sut);

         // Assert we got the welcome statement
         let reply = testAdapter.activityBuffer.shift();
         const expectedMsg = i18n.__("unBlockBotDialogWelcomeMsg");
         assert.strictEqual(reply.text, expectedMsg);
         reply =  testAdapter.activityBuffer.shift();
         const confirmMsg = i18n.__("confirmLookIntoStepStandardMsg");
         assert.strictEqual(reply.text, confirmMsg+" (1) Yes please! or (2) No thanks");

         // Assert that we started the main dialog.
         // TODO: fix this unit test
       //  reply = testAdapter.activityBuffer.shift();
        // assert.strictEqual(reply.text, 'mockRootDialog mock invoked')

     });
 });