// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { StatePropertyAccessor, TurnContext } from 'botbuilder';
import {
    ChoicePrompt, ComponentDialog,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { Choice } from '../../node_modules/botbuilder-dialogs/src/choices/findChoices';
import { CommonPromptValidatorModel } from '../models/commonPromptValidatorModel';
import { FeedbackDialog, FeedBack_Dialog } from './Common/FeedbackDialog';
import { oASBenifitDialog, OAS_BENEFIT_DIALOG_STEP } from './OASBenifit/oASBenifitDialog';
import { CommonChoiceCheckDialog, COMMON_CHOICE_CHECK_DIALOG } from './UpdateProfile/UpdatePhoneNumber/commonChoiceCheckDialog';
import { UpdateProfileDialog, UPDATE_PROFILE_DIALOG_STEP } from './UpdateProfile/updateProfileDialog';


const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

export const MAIN_DIALOG_STEP = 'MAIN_DIALOG_STEP';

export class MainDialog extends ComponentDialog {

    constructor() {
        super(MAIN_DIALOG_STEP);

        if (!UpdateProfileDialog) throw new Error('[MainDialog]: Missing parameter \'updateProfileDialog\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TEXT_PROMPT'))
            .addDialog(new UpdateProfileDialog())
            .addDialog(new FeedbackDialog())
            .addDialog(new CommonChoiceCheckDialog())
            .addDialog(new oASBenifitDialog())
            .addDialog(new ChoicePrompt(CHOICE_PROMPT,this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {TurnContext} context
     */
    public async run(context: TurnContext, accessor: StatePropertyAccessor<DialogState>) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */

    // validates all the prompts
     private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    private async introStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        
       let commonPromptValidatorModel = new CommonPromptValidatorModel(
        ["IwanttoUpdateMyPersonalInformation", "IhaveaQuestionAboutOASPension"],
        3,
        'MainDialog'
    );
    //call dialog
    return await stepContext.beginDialog(COMMON_CHOICE_CHECK_DIALOG, commonPromptValidatorModel); 
    }
    
    private async actStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;

        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status)
        {
            switch (commonPromptValidatorModel.result) {
                case 'IwanttoUpdateMyPersonalInformation':
                    return await stepContext.beginDialog(UPDATE_PROFILE_DIALOG_STEP, UpdateProfileDialog);
                case 'IhaveaQuestionAboutOASPension':
                    return await stepContext.beginDialog(OAS_BENEFIT_DIALOG_STEP,UpdateProfileDialog); 
            }
        }
        else
        {
            return stepContext.beginDialog(FeedBack_Dialog, FeedbackDialog);
            return await stepContext.endDialog();
        }
    }
}
   


