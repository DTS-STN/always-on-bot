import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';
import { LUISAlwaysOnBotSetup } from '../alwaysOnDialogs/alwaysOnBotRecognizer';

import i18n from '../locales/i18nConfig';
import { OAS_BENEFIT_STEP,OASBenefitStep } from '../alwaysOnDialogs/OASBenefit/oASBenefitStep';
import { CommonChoiceCheckStep, COMMON_CHOICE_CHECK_STEP } from './commonChoiceCheckStep';
import { UpdateProfileStep, UPDATE_PROFILE_STEP } from '../alwaysOnDialogs/UpdateProfile/updateProfileStep';
import { FeedBackStep, FEED_BACK_STEP } from './feedBackStep';
import { ALWAYS_ON_BOT_DIALOG } from '../alwaysOnDialogs/alwaysOnBotDialog';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
let isFeedBackStepPassed:boolean = false;
export const CONTINUE_AND_FEEDBACK_STEP = 'CONTINUE_AND_FEEDBACK_STEP';
const CONTINUE_AND_FEEDBACK_WATERFALL_STEP = 'CONTINUE_AND_FEEDBACK_WATERFALL_STEP';

export class ContinueAndFeedbackStep extends ComponentDialog {
    constructor() {
        super(CONTINUE_AND_FEEDBACK_STEP);
       this.addDialog(new CommonChoiceCheckStep());

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new FeedBackStep())
            .addDialog(new WaterfallDialog(CONTINUE_AND_FEEDBACK_WATERFALL_STEP, [
                this.continueStep.bind(this),
                this.confirmStep.bind(this)
            ]));

        this.initialDialogId = CONTINUE_AND_FEEDBACK_WATERFALL_STEP;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
   /**
    * Initial step in the waterfall. This will prompts Yes and No to the User like confirmation step.
    *
    * This is the end of the process,either user will go to the main flow or will end the process if there are no action required by the user.
    */
    async continueStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {

        const commonPromptValidatorModel = new CommonPromptValidatorModel(
            ['promptConfirmYes', 'promptConfirmNo'],
            Number(i18n.__('MaxRetryCount')),
            'continueAndFeed',i18n.__('continueAndFeedPromptMessage')
        );
        // call dialog
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_STEP, commonPromptValidatorModel);
    }

   /**
    * Confirmation step in the waterfall.bot chooses the different flows depends on user's input
    * If users selects 'Yes' then bot will navigate to the main workflow
    * If users selects 'No' then bot will navigate to the feedback flow
    */
    async confirmStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {
        const recognizer = LUISAlwaysOnBotSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);
        switch (intent) {
            case 'promptConfirmYes':
                return await stepContext.replaceDialog(ALWAYS_ON_BOT_DIALOG, null);
            case 'promptConfirmNo':
                return await stepContext.replaceDialog(FEED_BACK_STEP,FeedBackStep);
            default:
                isFeedBackStepPassed =  true;
                return stepContext.replaceDialog(FEED_BACK_STEP, FeedBackStep);
        }
    }
}
