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
import { Choice } from 'botbuilder-dialogs/src/choices/findChoices';
import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';
import { FeedBackStep, FEED_BACK_STEP } from '../common/feedBackStep';

import { OASBenefitStep, OAS_BENEFIT_STEP } from './OASBenefit/oASBenefitStep';
import { UpdateProfileStep, UPDATE_PROFILE_STEP } from './UpdateProfile/updateProfileStep';
import i18n from '../locales/i18nConfig';
import { CommonChoiceCheckStep, COMMON_CHOICE_CHECK_STEP } from '../common/commonChoiceCheckStep';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const ALWAYS_ON_BOT_WATERFALL_DIALOG = 'ALWAYS_ON_BOT_WATERFALL_DIALOG';
export const ALWAYS_ON_BOT_DIALOG = 'ALWAYS_ON_BOT_DIALOG';
export class AlwaysOnBotDialog extends ComponentDialog {

    constructor() {
        super(ALWAYS_ON_BOT_DIALOG);

        if (!UpdateProfileStep) throw new Error('[MainDialog]: Missing parameter "updateProfileDialog" is required');

        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new UpdateProfileStep());
        this.addDialog(new FeedBackStep());
        this.addDialog(new CommonChoiceCheckStep());
        this.addDialog(new OASBenefitStep());
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT,this.CustomChoiceValidator));
        this.addDialog(new WaterfallDialog(ALWAYS_ON_BOT_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this)
            ]));

        this.initialDialogId = ALWAYS_ON_BOT_WATERFALL_DIALOG;
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

    /**
     * Passing intents list related to main dialog.
     * Passing master error count to common choice dialog.
     * Passing current dialog name to common choice dialog.
     */
    private async introStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {

       const commonPromptValidatorModel = new CommonPromptValidatorModel(
        ['IWantToUpdateMyPersonalInformation', 'IHaveQuestionAboutOASPension'],
        Number(i18n.__('MaxRetryCount')),
        'AlwaysOnBot',i18n.__('AlwaysOnBotPromptMessage')
    );
    // call dialog
    return await stepContext.beginDialog(COMMON_CHOICE_CHECK_STEP, commonPromptValidatorModel);
    }
    /**
     * This is the final step in waterfall.bot displays the main workflow prompt suggestions to the user.(I Want To Update My Personal Information and I Have a Question About OASPension)
     */
    private async actStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;

        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status)
        {
            switch (commonPromptValidatorModel.result) {
                case 'IWantToUpdateMyPersonalInformation':
                    return await stepContext.replaceDialog(UPDATE_PROFILE_STEP, UpdateProfileStep);
                case 'IHaveQuestionAboutOASPension':
                    return await stepContext.replaceDialog(OAS_BENEFIT_STEP,OASBenefitStep);
            }
        }
        else
        {
            return stepContext.replaceDialog(FEED_BACK_STEP, FeedBackStep);
        }
    }
}



