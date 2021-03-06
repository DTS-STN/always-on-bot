// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';

// Note: Ensure you have a .env file and include LuisAppId, LuisAPIKey and LuisAPIHostName.
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });



import { INodeSocket } from 'botframework-streaming';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    ConversationState,
    createBotFrameworkAuthenticationFromConfiguration,
    BotFrameworkAdapter,
    MemoryStorage,
    UserState
} from 'botbuilder';
import { DialogSet } from 'botbuilder-dialogs';

// The bot and its main dialog.
import { VirtualassistantAOBot } from './bots/VirtualassistantAOBot';
import { ALWAYS_ON_BOT_DIALOG,AlwaysOnBotDialog } from './dialogs/alwaysOnDialogs/alwaysOnBotDialog';


const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword

});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
  });
// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
// const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
    // Clear out state
    await conversationState.delete(context);
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
let conversationState: ConversationState;
let userState: UserState;

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);
userState = new UserState(memoryStorage);

// Create the main dialog.
const dialog = new AlwaysOnBotDialog();

const bot = new VirtualassistantAOBot(conversationState, userState, dialog);

// Create HTTP server
const server = restify.createServer();

server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});
// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
      // Route to main dialog.
      await bot.run(context);
    });
  });
// [OPTIONAL]
// When deploying azure usually pings the web app server to know the status. The request can be ignored or answered, depending
// on the implementation. In my case it was logging the errors so I prefer to just reply to the request.
server.get('/', (req, res, next) => {
    res.send(200);
    next();
  });

// Listen for Upgrade requests for Streaming.
server.on('upgrade', async (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);
    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;
    await streamingAdapter.process(req, socket as unknown as INodeSocket, head, (context) => bot.run(context));
});
