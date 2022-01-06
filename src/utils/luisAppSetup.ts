import { LuisRecognizer } from 'botbuilder-ai';

export const LUISAOSetup = (stepContext: any) => {

    // Luis Application Settings
    let applicationId: string;
    let endpointKey: string;
    let endpoint: string;
    let recognizer: any;

    // Then change LUIZ appID
    if (
        stepContext.context.activity.locale.toLowerCase() === 'fr-ca' ||
        stepContext.context.activity.locale.toLowerCase() === 'fr-fr' ||
        stepContext.context.activity.locale.toLowerCase() === 'fr'
    ) {
        applicationId = process.env.LuisAppIdFR;
        endpointKey = process.env.LuisAPIKeyFR;
        endpoint = process.env.LuisAPIHostNameFR;
    } else {
        applicationId = process.env.LuisAppIdEN;
        endpointKey = process.env.LuisAPIKeyEN;
        endpoint = process.env.LuisAPIHostNameEN;
    }

    // LUIZ Recogniser processing
    recognizer = new LuisRecognizer(
        {
            'applicationId': `${applicationId}`,
            'endpointKey': `${endpointKey}`,
            'endpoint': `${endpoint}`
        },
        {
            includeAllIntents: true,
            includeInstanceData: true
        },
        true
    );

    return recognizer;

}