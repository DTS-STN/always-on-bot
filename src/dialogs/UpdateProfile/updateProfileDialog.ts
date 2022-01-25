// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import {
    Choice, ChoicePrompt, ComponentDialog, DialogTurnResult, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';
import { ContinueAndFeedbackDialog } from '../Common/continueAndFeedbackDialog';
import { FeedbackDialog, FeedBack_Dialog } from '../Common/FeedbackDialog';
import { UpdateAddressDialog, UPDATE_ADDRESS_DIALOG_STEP } from './UpdateAddress/updateAddressDialog';
import { CommonChoiceCheckDialog, COMMON_CHOICE_CHECK_DIALOG } from './UpdatePhoneNumber/commonChoiceCheckDialog';
import { UpdateMyPhoneDialog } from './UpdatePhoneNumber/updateMyPhoneDialog';



const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const UPDATE_PHONE_NUMBER_DIALOG_STEP = 'UPDATE_PHONE_NUMBER_DIALOG_STEP';

export const UPDATE_PROFILE_DIALOG_STEP = 'UPDATE_PROFILE_DIALOG_STEP';
// Define the main dialog and its related components.
export class UpdateProfileDialog extends ComponentDialog {
    constructor() {
        super(UPDATE_PROFILE_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new UpdateMyPhoneDialog())
            .addDialog(new UpdateAddressDialog())
            .addDialog(new CommonChoiceCheckDialog())
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.checkProfileStep.bind(this),
                this.routingStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async checkProfileStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {

        let commonPromptValidatorModel = new CommonPromptValidatorModel(
            ["UpdateMyAddress", "UpdateMyPhoneNumber", "UpdateMyEmail"],
            3,
            'UpdateMyProfile'
        );
        //call dialog
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_DIALOG, commonPromptValidatorModel);
    }
    /**
    * Selection step in the waterfall.
    * Bot chooses the flows(UpdateMyAddress,UpdateDirectDeposit) based on user's input.
    */
    async routingStep(stepContext) {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status) {
            switch (commonPromptValidatorModel.result) {
                case 'UpdateMyAddress':
                    return await stepContext.beginDialog(UPDATE_ADDRESS_DIALOG_STEP, UpdateAddressDialog);
                case 'UpdateMyPhoneNumber':
                    return await stepContext.beginDialog(UPDATE_PHONE_NUMBER_DIALOG_STEP, UpdateMyPhoneDialog);
                case 'UpdateMyEmail':
                    return await stepContext.cancelAllDialogs();  
            }
        }
        else {
            return stepContext.beginDialog(FeedBack_Dialog, FeedbackDialog);
        }
    }
}
