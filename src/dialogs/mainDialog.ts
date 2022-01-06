// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { InputHints, StatePropertyAccessor, TurnContext } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import {
    ChoiceFactory, ChoicePrompt, ComponentDialog,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus, ListStyle,
    PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { Choice } from '../../node_modules/botbuilder-dialogs/src/choices/findChoices';
import { LUISAOSetup } from '../utils/luisAppSetup';
import i18n from './locales/i18nconfig';
import { oASBenifitDialog, OAS_BENEFIT_DIALOG_STEP } from './OASBenifit/oASBenifitDialog';
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
        
        let promptMsg = i18n.__('welcomeChoicePromptMain');
        let promptOptions: Array<string>;
        promptOptions = i18n.__('welcomeChoicesMain');
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptMsg,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.suggestedAction
        });
         await stepContext.next(stepContext);
    }

    /**
     * Second step in the waterall.  This will use LUIS to find the update profile and Question about OASbenefit.
     * Then, it hands off to the Update Profile dialog or Question about OASbenefit based on users's decision.
     */
    private async actStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        switch (intent) {
            case 'UpdateProfile':
                return await stepContext.beginDialog(UPDATE_PROFILE_DIALOG_STEP, UpdateProfileDialog);
            case 'QuestionaboutOASbenefit':
                return await stepContext.beginDialog(OAS_BENEFIT_DIALOG_STEP, oASBenifitDialog);
            default:
                // Catch all for unhandled intents
                const didntUnderstandMessageText = 'Sorry i didn\'t understand that, try asking me different question';
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        return await stepContext.next();
    }

}
