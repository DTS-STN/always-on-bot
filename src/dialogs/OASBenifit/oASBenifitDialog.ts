// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { InputHints } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle,
    PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext,

} from 'botbuilder-dialogs';
import { LUISAOSetup } from '../../utils/luisAppSetup';
import i18n from '../locales/i18nconfig';
import { APPLICATION_STATUS_DIALOG_STEP,ApplicationStatusDialog } from './applicationStatusDialog';
import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';
import { COMMON_CHOICE_CHECK_DIALOG,CommonChoiceCheckDialog } from '../UpdateProfile/UpdatePhoneNumber/commonChoiceCheckDialog';
import { FeedBack_Dialog,FeedbackDialog } from '../Common/FeedbackDialog';

const WATERFALL_DIALOG = 'waterfallDialog';
const CHOISE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

export const OAS_BENEFIT_DIALOG_STEP = 'OAS_BENEFIT_DIALOG_STEP';

// Define the main dialog and its related components.

export class oASBenifitDialog extends ComponentDialog {
    constructor() {
        super(OAS_BENEFIT_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ApplicationStatusDialog())
            .addDialog(new ChoicePrompt(CHOISE_PROMPT,this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.checkApplicationStatusStep.bind(this),
                this.selectionStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    async checkApplicationStatusStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {

        let commonPromptValidatorModel = new CommonPromptValidatorModel(
            ["WhatisMyApplicationStatus"],
            4,
            'OASBenefit'
        );
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_DIALOG, commonPromptValidatorModel);
    }
     
   /**
   * This is the final step in the main waterfall dialog.
   * Bot promts the 'Date of Next Payment' and 'Payment amount change'
   * Users selects the one of the promts.
   */

    private async selectionStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;

        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status)
        {
            switch (commonPromptValidatorModel.result) {
                case 'WhatisMyApplicationStatus':
                    return await stepContext.replaceDialog(APPLICATION_STATUS_DIALOG_STEP, ApplicationStatusDialog)
            }
        }
        else
        {
            return stepContext.beginDialog(FeedBack_Dialog, FeedbackDialog);
            return await stepContext.endDialog();
        }
    }
}
    
