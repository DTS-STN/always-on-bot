
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

    });

    describe('Should ask a user who declines the lookup to confirm their intent', () => {

    });

    describe('Should send a positive intent to the DirectDepositDialog', () => {

    });

    describe('Should send a negative intent to a link for more information and ask for feedback', () => {

    });

});