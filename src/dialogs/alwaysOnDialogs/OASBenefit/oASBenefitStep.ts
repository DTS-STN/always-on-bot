import { InputHints } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle,
    PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext

} from 'botbuilder-dialogs';
import { LUISAlwaysOnBotSetup } from '../alwaysOnBotRecognizer';

import i18n from '../../locales/i18nConfig';
import { APPLICATION_STATUS_STEP,ApplicationStatusStep } from './applicationStatusStep';
import { CommonPromptValidatorModel } from '../../../models/commonPromptValidatorModel';
import { FEED_BACK_STEP,FeedBackStep } from '../../common/feedBackStep';
import { COMMON_CHOICE_CHECK_STEP } from '../../common/commonChoiceCheckStep';


const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

export const OAS_BENEFIT_STEP = 'OAS_BENEFIT_STEP';
const OAS_BENEFIT_WATERFALL_STEP = 'OAS_BENEFIT_WATERFALL_STEP';
// Define the main dialog and its related components.

export class OASBenefitStep extends ComponentDialog {
    constructor() {
        super(OAS_BENEFIT_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ApplicationStatusStep())
            .addDialog(new ChoicePrompt(CHOICE_PROMPT,this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(OAS_BENEFIT_WATERFALL_STEP, [
                this.checkApplicationStatusStep.bind(this),
                this.selectionStep.bind(this)
            ]));

        this.initialDialogId = OAS_BENEFIT_WATERFALL_STEP;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
     * Passing intents list related to OASBenefit dialog.
     * Passing master error count to common choice dialog.
     * Passing current dialog name to common choice dialog.
     */
    async checkApplicationStatusStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {

        const commonPromptValidatorModel = new CommonPromptValidatorModel(
            ['WhatIsMyApplicationStatus'],
            Number(i18n.__('MaxRetryCount')),
            'OASBenefit',i18n.__('OASBenefitPromptMessage')
        );
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_STEP, commonPromptValidatorModel);
    }

   /**
    * This is the final step in the main waterfall dialog.
    * Bot prompts the "Date of Next Payment" and Application Status
    * Users selects the "What's My Application Status" prompt.
    */

    private async selectionStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;

        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status)
        {
            switch (commonPromptValidatorModel.result) {
                case 'WhatIsMyApplicationStatus':
                    return await stepContext.replaceDialog(APPLICATION_STATUS_STEP, ApplicationStatusStep)
            }
        }
        else
        {
            return stepContext.replaceDialog(FEED_BACK_STEP, FeedBackStep);
        }
    }
}

