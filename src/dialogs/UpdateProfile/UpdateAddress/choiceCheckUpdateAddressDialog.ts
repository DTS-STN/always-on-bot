import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory,
    ChoicePrompt, ComponentDialog, ListStyle, PromptValidatorContext, WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../models/commonPromptValidatorModel';
import { LUISAOSetup } from '../../../utils/luisAppSetup';
import i18n from '../../locales/i18nconfig';

const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
export const CHOICE_CHECK_UPDATE_ADDRESS_DIALOG = 'CHOICE_CHECK_UPDATE_ADDRESS_DIALOG';

export class ChoiceCheckUpdateAddressDialog extends ComponentDialog {
    constructor() {
        super(CHOICE_CHECK_UPDATE_ADDRESS_DIALOG);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.promptStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }

    async promptStep(stepContext: WaterfallStepContext) {
        const commonPromptValidatorModel = stepContext.options as CommonPromptValidatorModel;
        let promptMessage: string;
        // if initial trigger
        if (commonPromptValidatorModel.retryCount == 0) {
            promptMessage = i18n.__(`${commonPromptValidatorModel.promptCode}PromptMessage`);
        }
        // if max retries exceeded
        else if (commonPromptValidatorModel.retryCount == 4) {
            commonPromptValidatorModel.status = false;
            const exceededRetryMessage = i18n.__(`MasterRetryExceededMessage`);
            //await adaptiveCard(stepContext, callbackCard(stepContext.context.activity.locale,exceededRetryMessage));
            return await stepContext.endDialog(commonPromptValidatorModel);
        }
        // on every rerty
        else {
            promptMessage = i18n.__(`${commonPromptValidatorModel.promptCode}RetryPromptMessage`);
        }

        const promptOptions = i18n.__(`${commonPromptValidatorModel.promptCode}PromptOptions`);
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptMessage,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.suggestedAction
        });
    }

    async finalStep(stepContext: WaterfallStepContext) {
        const recognizer = LUISAOSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
        const commonPromptValidatorModel = stepContext.options as CommonPromptValidatorModel;

        const matchFound = commonPromptValidatorModel.intents.includes(intent);
        if (matchFound)
        {
            commonPromptValidatorModel.result = intent;
            commonPromptValidatorModel.status = true;
            return await stepContext.endDialog(commonPromptValidatorModel);
        }
        commonPromptValidatorModel.result = intent;
        commonPromptValidatorModel.retryCount++;
        return await stepContext.replaceDialog(CHOICE_CHECK_UPDATE_ADDRESS_DIALOG, commonPromptValidatorModel);       
   }
}
