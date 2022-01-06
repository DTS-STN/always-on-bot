// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, ListStyle, PromptValidatorContext, TextPrompt,
    WaterfallDialog
} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../utils/luisAppSetup';
import i18n from '../locales/i18nconfig';
import { oASBenifitDialog, OAS_BENEFIT_DIALOG_STEP } from '../OASBenifit/oASBenifitDialog';
import { UpdateProfileDialog, UPDATE_PROFILE_DIALOG_STEP } from '../UpdateProfile/updateProfileDialog';

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CHOISE_PROMPT = 'CHOISE_PROMPT'

export const CONTINUE_AND_FEEDBACK_DIALOG_STEP = 'CONTINUE_AND_FEEDBACK_DIALOG_STEP';

export class ContinueAndFeedbackDialog extends ComponentDialog {
    constructor() {
        super(CONTINUE_AND_FEEDBACK_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOISE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.continueStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)

            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }

    async continueStep(stepContext) {
        const prompText = i18n.__('continueAndFeedChoicePrompt');
        const choices = i18n.__('continueAndFeedChoices');
        return await stepContext.prompt(CHOISE_PROMPT, {
            prompt: prompText,
            choices: ChoiceFactory.toChoices(choices),
            style: ListStyle.suggestedAction
        });
    }

    async confirmStep(stepContext) {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                let promptMsg = i18n.__('welcomeChoicePromptMain');
                let promptOptions: Array<string>;
                promptOptions = i18n.__('welcomeChoicesMain');
                return await stepContext.prompt(CHOISE_PROMPT, {
                prompt: promptMsg,
                choices: ChoiceFactory.toChoices(promptOptions),
                style: ListStyle.suggestedAction
        });
         await stepContext.next(stepContext);
                return await stepContext.endDialog(this.id);
            case 'No':
                await stepContext.context.sendActivity(i18n.__('continueAndFeedOK'));
                await stepContext.context.sendActivity(i18n.__('continueAndFeedRating'));
                const promptText2 = i18n.__('continueAndFeedChoicePrompt2');
                let choices2 = Array<string>();
                choices2 = i18n.__('continueAndFeedChoices2');
                return await stepContext.prompt(CHOISE_PROMPT, {
                    prompt: promptText2,
                    choices: ChoiceFactory.toChoices(choices2)
                });
        }
    }

    async finalStep(stepContext) {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'UpdateProfile':
                return await stepContext.replaceDialog(UPDATE_PROFILE_DIALOG_STEP, UpdateProfileDialog);
            case 'QuestionaboutOASbenefit':
                return await stepContext.replaceDialog(OAS_BENEFIT_DIALOG_STEP, oASBenifitDialog);
            default:
        await stepContext.context.sendActivity(i18n.__('continueAndFeedExcellent'));
        return await stepContext.endDialog(this.id);
        }
    }
}
