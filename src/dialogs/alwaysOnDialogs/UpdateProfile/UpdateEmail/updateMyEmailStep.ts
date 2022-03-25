import {
    Choice, ChoicePrompt, ComponentDialog, PromptValidatorContext, TextPrompt,
    WaterfallDialog
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../../models/commonPromptValidatorModel';
import i18n from '../../../locales/i18nConfig';
import { ContinueAndFeedbackStep, CONTINUE_AND_FEEDBACK_STEP } from '../../../common/continueAndFeedbackStep';
import { FeedBackStep, FEED_BACK_STEP } from '../../../common/feedBackStep';
import { COMMON_CHOICE_CHECK_STEP } from '../../../common/commonChoiceCheckStep';
import { ConfirmEmailStep, CONFIRM_EMAIL_STEP } from './confirmEmailStep';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

export const UPDATE_EMAIL_STEP = 'UPDATE_EMAIL_STEP';
const UPDATE_EMAIL_WATERFALL_STEP = 'UPDATE_EMAIL_WATERFALL_STEP';
// Define the main dialog and its related components.
export class UpdateMyEmailStep extends ComponentDialog {
    constructor() {
        super(UPDATE_EMAIL_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new ConfirmEmailStep())
            .addDialog(new ContinueAndFeedbackStep())
            .addDialog(new WaterfallDialog(UPDATE_EMAIL_WATERFALL_STEP, [
                this.checkPhoneNumberStep.bind(this),
                this.routingStep.bind(this)
            ]));

        this.initialDialogId = UPDATE_EMAIL_WATERFALL_STEP;
    }
    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    // First step in the waterfall dialog. Prompts the user for a command.
    async checkPhoneNumberStep(stepContext) {

        const commonPromptValidatorModel = new CommonPromptValidatorModel(
            ['promptConfirmYes', 'promptConfirmNo'],
            Number(i18n.__('MaxRetryCount')),
            'UpdateMyEmail',i18n.__('UpdateMyEmailPromptMessage')
        );
        // call dialog
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_STEP, commonPromptValidatorModel);

    }
    /**
     * Selection step in the waterfall.
     * Bot chooses the flows based on user"s input.
     */
    async routingStep(stepContext) {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status) {
            switch (commonPromptValidatorModel.result) {
                case 'promptConfirmYes':
                    commonPromptValidatorModel.retryCount = 0;
                    return await stepContext.beginDialog(CONFIRM_EMAIL_STEP, commonPromptValidatorModel);
                case 'promptConfirmNo':
                    await stepContext.context.sendActivity(i18n.__('NoStatementEmail'));
                    return stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_STEP, ContinueAndFeedbackStep);
            }
        }
        else
        {
            return stepContext.replaceDialog(FEED_BACK_STEP, FeedBackStep);
        }

    }
}