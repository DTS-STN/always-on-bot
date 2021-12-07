
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
describe('Unblock Direct Deposit Step', () => {
    describe('Should show the Direct Deposit welcome messages', () => {
    });

    describe('Should ask for their transit number', () => {
    });

    describe('Should ask for their institution number', () => {
    });

    describe('Should ask for their bank account number', () => {
    });

    describe('Should fail gracefully after 3 errors', () => {
    });
});