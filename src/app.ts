import * as path from 'path';
import { config } from 'dotenv';
import * as restify from 'restify';
// Read environment variables from .env file
// Import required bot configuration.
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
  BotFrameworkAdapter,
  ConversationState,
  MemoryStorage,
  UserState,
} from 'botbuilder';
import { DialogSet } from 'botbuilder-dialogs';

// This bot's main dialog.
import { VirtualAssistantCallbackBot } from './bots/virtualAssistantCallbackBot';
// import i18n from './dialogs/locales/i18nConfig';

// Create HTTP server
const server = restify.createServer();
// server.use(i18n.init);
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`);
  console.log(
    '\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator',
  );
  console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
});

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights. See https://aka.ms/bottelemetry for telemetry
  //       configuration instructions.
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    'OnTurnError Trace',
    `${error}`,
    'https://www.botframework.com/schemas/error',
    'TurnError',
  );

  // Send a message to the user
  await context.sendActivity('The bot encountered an error or bug.');
  await context.sendActivity(
    'To continue to run this bot, please fix the bot source code.',
  );
};

// Set the onTurnError for the singleton BotFrameworkAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Define the state store for your bot.
// See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state storage system to persist the dialog and user state between messages.
const memoryStorage = new MemoryStorage();

// Create conversation state with in-memory storage provider.
const conversationState = new ConversationState(memoryStorage);

// Create the Dialog State for the bot
const dialogs = new DialogSet(conversationState.createProperty('DialogState'));

// Create the User State for the bot
const userState = new UserState(memoryStorage);

// Create the main dialog.
const myVirtualAssistantBot = new VirtualAssistantCallbackBot(
  conversationState,
  userState,
  dialogs,
);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    // Route to main dialog.
    await myVirtualAssistantBot.run(context);
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
server.on('upgrade', (req, socket, head) => {
  // Create an adapter scoped to this WebSocket connection to allow storing session data.
  const streamingAdapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
  });
  // Set onTurnError for the BotFrameworkAdapter created for each connection.
  streamingAdapter.onTurnError = onTurnErrorHandler;

  streamingAdapter.useWebSocket(req, socket, head, async (context) => {
    // After connecting via WebSocket, run this logic for every request sent over
    // the WebSocket connection.
    await myVirtualAssistantBot.run(context);
  });
});
