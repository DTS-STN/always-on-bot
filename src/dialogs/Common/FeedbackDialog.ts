// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import i18n from '../locales/i18nconfig';

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CHOISE_PROMPT = 'CHOISE_PROMPT'

export const FeedBack_Dialog = 'FeedBack_Dialog';

export class FeedbackDialog extends ComponentDialog {
    constructor() {
        super(FeedBack_Dialog);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOISE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.feedbackStep.bind(this),
                this.finalStep.bind(this)

            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    async feedbackStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {
                const promptText2 = i18n.__('continueAndFeedRating');
                let choices2 = Array<string>();
                choices2 = i18n.__('continueAndFeedChoices2');
                return await stepContext.prompt(CHOISE_PROMPT, {
                    prompt: promptText2,
                    choices: ChoiceFactory.toChoices(choices2)
                });
    }
    async finalStep(stepContext) {
            await stepContext.context.sendActivity(i18n.__('continueAndFeedExcellent'));
            return await stepContext.cancelAllDialogs(this.id);
    }
}
