// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';
import { LUISAOSetup } from '../../utils/luisAppSetup';
import i18n from '../locales/i18nconfig';
import { COMMON_CHOICE_CHECK_DIALOG,CommonChoiceCheckDialog } from '../UpdateProfile/UpdatePhoneNumber/commonChoiceCheckDialog';

import { UpdateProfileDialog, UPDATE_PROFILE_DIALOG_STEP } from '../UpdateProfile/updateProfileDialog';
import { FeedbackDialog, FeedBack_Dialog } from './FeedbackDialog';

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CHOISE_PROMPT = 'CHOISE_PROMPT'

export const CONTINUE_AND_FEEDBACK_DIALOG_STEP = 'CONTINUE_AND_FEEDBACK_DIALOG_STEP';

export class ContinueAndFeedbackDialog extends ComponentDialog {
    constructor() {
        super(CONTINUE_AND_FEEDBACK_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOISE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new FeedbackDialog())
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

    async continueStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        const prompText = i18n.__('continueAndFeedChoicePrompt');
        const choices = i18n.__('continueAndFeedChoices');
        return await stepContext.prompt(CHOISE_PROMPT, {
            prompt: prompText,
            choices: ChoiceFactory.toChoices(choices),
            style: ListStyle.suggestedAction
        });
    }

    async confirmStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'Yes':
                let commonPromptValidatorModel = new CommonPromptValidatorModel(
                    ["IwanttoUpdateMyPersonalInformation", "IhaveaQuestionAboutOASPension"],
                    3,
                    'MainDialog'
                );
                //call dialog
                return await stepContext.beginDialog(COMMON_CHOICE_CHECK_DIALOG, commonPromptValidatorModel);
            case 'No':
                return await stepContext.replaceDialog(FeedBack_Dialog,FeedbackDialog);
        }
    }

    async finalStep(stepContext) {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status) {
            switch (commonPromptValidatorModel.result) {
                case 'IwanttoUpdateMyPersonalInformation':
                    return await stepContext.replaceDialog(UPDATE_PROFILE_DIALOG_STEP, UpdateProfileDialog);
                case 'IhaveaQuestionAboutOASPension':
                    return await stepContext.endDialog(this.id);
            }
        }
        else {
            return await stepContext.cancelAllDialogs(this.id);
        }
    }
}
