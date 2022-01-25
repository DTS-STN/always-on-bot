import { LuisRecognizer } from 'botbuilder-ai';
import { Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle, PromptValidatorContext, TextPrompt, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../models/commonPromptValidatorModel';
import { LUISAOSetup } from '../../../utils/luisAppSetup';
import { ContinueAndFeedbackDialog, CONTINUE_AND_FEEDBACK_DIALOG_STEP } from '../../Common/continueAndFeedbackDialog';
import i18n from '../../locales/i18nconfig';
import { AddressDetails } from './addressDetails';
import { CallBackDailog, CALL_BACK_DAILOG_STEP } from './callBackDailog';
import { ChoiceCheckUpdateAddressDialog, CHOICE_CHECK_UPDATE_ADDRESS_DIALOG } from './choiceCheckUpdateAddressDialog';
import { UpdateAddressDialog, UPDATE_ADDRESS_DIALOG_STEP } from './updateAddressDialog';


const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOISE_PROMPT';
const TEXT_PROMPT = 'textPrompt';

let fullAddress: string;
const MAX_ERROR_COUNT = 4;

export const GET_ADDRESS_DIALOG_STEP = 'GET_ADDRESS_DIALOG_STEP';
// Define the main dialog and its related components.
export class GetAddressesDialog extends ComponentDialog {
    constructor() {
        super(GET_ADDRESS_DIALOG_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT))
            .addDialog(new ContinueAndFeedbackDialog())
            .addDialog(new ChoiceCheckUpdateAddressDialog())
            .addDialog(new CallBackDailog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.initialStep.bind(this),
                this.continueStep.bind(this),
                this.checkSelectedAddressStep.bind(this),
                this.StreetNumberStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
     async initialStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        return await stepContext.prompt(TEXT_PROMPT, i18n.__('updateAddressPostalCodePrompt'));
    }
    
    async continueStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
                
                const getAddresses = stepContext.options as AddressDetails;
                getAddresses.PostalCode=stepContext.context.activity.text;
                getAddresses.masterError = false;
                getAddresses.currentStep = "";
                const data = await this.getAddress(stepContext.context.activity.text,i18n.__('APILanguage'));
               try{
                    const addressResults = data["wsaddr:SearchResults"];
                    const addressRecordInfo = addressResults["wsaddr:Information"];
                    let isStreetNumberRequired:boolean = false;

                    if(Number(addressRecordInfo["nc:MessageText"])>1)
                    {
                        isStreetNumberRequired = true;
                    }

                    console.log(isStreetNumberRequired);
                    const addressMatches = addressResults["wsaddr:AddressMatches"];
                    const addressCategoryText = addressMatches[0]["nc:AddressCategoryText"];
                    if(addressCategoryText == "RuralLockBox"){

                    const cityName = addressMatches[0]["nc:AddressCityName"];
                    const province = addressMatches[0]["can:ProvinceCode"];
                    const addressPostalCode = addressMatches[0]["nc:AddressPostalCode"];
                    const streetMinText = addressMatches[0]["wsaddr:LockBoxNumberMinimumText"];
                    const streetMaxText = addressMatches[0]["wsaddr:LockBoxNumberMaximumText"];
                    const streetCategoryCode = addressMatches[0]["can:StreetCategoryCode"];
                    const streetName= addressMatches[0]["nc:StreetName"];
                    const deliveryInstallationDescritpion = addressMatches[0]["wsaddr:DeliveryInstallationDescription"];
                    const deliveryInstallationQualifierName = addressMatches[0]["wsaddr:DeliveryInstallationQualifierName"];
                    const deliveryInstallationAreaName = addressMatches[0]["wsaddr:DeliveryInstallationAreaName"];
                    fullAddress =  deliveryInstallationDescritpion+ " " + deliveryInstallationQualifierName+ " " + deliveryInstallationAreaName;
                    getAddresses.FullAddress = this.GetSentence(fullAddress) + " "+ String(province).toUpperCase()+ " " + String(getAddresses.PostalCode).toUpperCase();
                    getAddresses.AddressType = "PO BOX";
                    console.log(fullAddress);
                    return await stepContext.prompt(TEXT_PROMPT, i18n.__('PoNumberPromptMessage'));  
                }
                else{

                    const addressResults = data["wsaddr:SearchResults"];
                    const addressMatches = addressResults["wsaddr:AddressMatches"];
                    var manyAddresses:string[] = new Array(20);  
                    if(isStreetNumberRequired){
                        getAddresses.AddressType = "MULTIPLE";
                        for (var i=0; i < addressMatches.length; i++) {

                            fullAddress = this.GetSentence(addressMatches[i]["nc:StreetName"])+ " " + this.GetSentence(addressMatches[i]["can:StreetCategoryCode"])+ " " + this.GetSentence(addressMatches[i]["nc:AddressCityName"])+ " " + addressMatches[i]["can:ProvinceCode"]+ " " +  String(getAddresses.PostalCode).toUpperCase();
                            if(!manyAddresses.includes(fullAddress)){
                            manyAddresses.push(fullAddress);
                            }
                        } 
                        console.log(manyAddresses);
                        let promptmsg = i18n.__('MoreStreetNumbersPrompt');
                        return await stepContext.prompt(CHOICE_PROMPT, {
                            prompt: promptmsg,
                            choices: ChoiceFactory.toChoices(manyAddresses),
                            style: ListStyle.heroCard
                        });
                    }
                    else{

                    const cityName = addressMatches[0]["nc:AddressCityName"];
                    const province = addressMatches[0]["can:ProvinceCode"];
                    const addressPostalCode = addressMatches[0]["nc:AddressPostalCode"];
                    const streetMinText = addressMatches[0]["wsaddr:StreetNumberMinimumText"];
                    const streetMaxText = addressMatches[0]["wsaddr:StreetNumberMaximumText"];
                    const streetCategoryCode = addressMatches[0]["can:StreetCategoryCode"];
                    const streetName= addressMatches[0]["nc:StreetName"];
                    if(streetMinText == streetMaxText){
                        fullAddress = streetMinText + " " + streetName+ " " + streetCategoryCode+ " " + cityName;
                    }
                    else{
                        fullAddress = streetName+ " " + streetCategoryCode+ " " + cityName;
                    }

                    getAddresses.FullAddress = this.GetSentence(fullAddress) + " " +  String(province).toUpperCase() + " " + String(getAddresses.PostalCode).toUpperCase();
                   
                    getAddresses.AddressType = "";
                    

                    if(streetMinText == streetMaxText){
                        return await stepContext.prompt(TEXT_PROMPT, i18n.__('UnitORApartmentPrompt'));  
                      }
                      else{
                        return await stepContext.prompt(TEXT_PROMPT, i18n.__('NewStreetNumberPrompt'));    
                      }  
                  }

                }    
           }catch(e){
              getAddresses.errorCount.getAddressesStep++;
              getAddresses.masterError = true;
              return await stepContext.next(); 
          }
    }
    /**
    * check selected address step in the waterfall.
    * when user selects the 'address not listed' prompt then bot asks the user to confirm postal code or re-choose the new address by entering the postal code.
    */
    private async checkSelectedAddressStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        
        const getAddresses = stepContext.options;
        
        if (getAddresses.AddressType == 'MULTIPLE') {
            getAddresses.currentStep = "street number";
            getAddresses.FullAddress =  stepContext.context.activity.text;
            return await stepContext.prompt(TEXT_PROMPT, i18n.__('StreetNumbersPrompt'));  
        }
        else if(getAddresses.masterError == true){
            
            if (getAddresses.errorCount.getAddressesStep >= MAX_ERROR_COUNT) {
                return await stepContext.replaceDialog(CALL_BACK_DAILOG_STEP, CallBackDailog);
            }
            await stepContext.context.sendActivity(i18n.__('IncorrectPostalCodePrompt'));
            return await stepContext.beginDialog(GET_ADDRESS_DIALOG_STEP,getAddresses);
          }
        else {
            const getAddresses = stepContext.options as AddressDetails;
            if(getAddresses.AddressType == "PO BOX"){
                getAddresses.UnitNumber = "PO BOX" + " " + stepContext.context.activity.text;
            }
            else{
                getAddresses.UnitNumber = stepContext.context.activity.text;
            }            
            let promptmsg = this.GetEditedResponse(i18n.__('AddressFoundCheck'), getAddresses);
            await stepContext.context.sendActivity(promptmsg);
            let commonPromptValidatorModel = new CommonPromptValidatorModel(
                ["Yes", "No"],
                4,
                'AddressFound'
            );
            return await stepContext.beginDialog(CHOICE_CHECK_UPDATE_ADDRESS_DIALOG, commonPromptValidatorModel);
            
        }
    
    }

    private async StreetNumberStep(stepContext) {
        const addressDetails = stepContext.options as AddressDetails;
        if (addressDetails.errorCount.confirmEmailStep >= MAX_ERROR_COUNT) {
            // Throw the master error flag
            addressDetails.masterError = true;
            return await stepContext.replaceDialog(CALL_BACK_DAILOG_STEP, CallBackDailog);
        }
        else{
        if(addressDetails.currentStep == "street number"){
            addressDetails.UnitNumber = stepContext.context.activity.text;
            let promptmsg = this.GetEditedResponse(i18n.__('AddressFoundCheck'), addressDetails);
           
            let commonPromptValidatorModel = new CommonPromptValidatorModel(
                ["Yes", "No"],
                4,
                'AddressFound'
            );
            return await stepContext.beginDialog(CHOICE_CHECK_UPDATE_ADDRESS_DIALOG, commonPromptValidatorModel);
        } 
        else{
            return await stepContext.next();
        }  
      } 
    }
    /**
    * This is the final step in the waterfall.
    * User selects the 'Yes' prompt to navigate to the users's feed back flow.
    * User selects the 'No' prompt to navigate to Address not listed flow.
    */
    
    private async finalStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
       
       const recognizer = LUISAOSetup(stepContext);
       const recognizerResult = await recognizer.recognize(stepContext.context);
       const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.7);
       switch (intent) {
           case 'Yes':
              await stepContext.context.sendActivity(i18n.__('UpdateAddress'));
               return await stepContext.beginDialog(CONTINUE_AND_FEEDBACK_DIALOG_STEP, ContinueAndFeedbackDialog);
           case 'No':
              return await stepContext.beginDialog(UPDATE_ADDRESS_DIALOG_STEP,UpdateAddressDialog);
            default :
            return stepContext.beginDialog(CALL_BACK_DAILOG_STEP, CallBackDailog);
            return await stepContext.endDialog();

       }
   }
    private GetEditedResponse(response:string,postalCode:AddressDetails)
    {
        if(postalCode.PostalCode!=null)
        {
        response=response.replace("@Postal_Code",postalCode.FullAddress);
        response=response.replace("null","").replace("Null","").replace("Po","") ;
        response=response.replace(","," ");
        }
        else
        {
            response=response.replace("@Postal_Code","");
            response=response.replace("null","");
            response=response.replace(","," ");
        }
        if(postalCode.UnitNumber!=null)
        {
            response=response.replace("#Unit_Number","#"+postalCode.UnitNumber);
        }
        else
        {
            response=response.replace("#Unit_Number","");
        }
        
        return response;
    }
    private GetEditedChoices(response: string[], postalCode: string) {
        let finaloptions=new Array();
        response.forEach(element=>{
            element=element.replace('@Postal_Code',postalCode)
            finaloptions.push(element)
        })
        return finaloptions;
    }
    private GetSentence(word: string){
        
            var sentence = word.toLowerCase().split(" ");
            let outSentence:string = "";
            for(var i = 0; i< sentence.length; i++){
               outSentence = outSentence + sentence[i][0].toUpperCase() + sentence[i].slice(1)+ " ";
            }
         return outSentence;
        
    }
 
    private async getAddress(postalCode:string,langAPI:string): Promise<object> {
        const query = {
            AddressPostalCode: postalCode,
         };
        const url = new URL('https://services-nonprd.api.esdc-edsc.canada.ca/foundation/address/wsaddress/ground/v1/CAN/search');
        url.search = new URLSearchParams(query).toString();
        const headers = {
            "Ocp-Apim-Subscription-Key": i18n.__('subscriptionKey'),
            "Accept-Language": langAPI,
        };
        const response = await fetch( url.toString(), {headers} );
        return await response.json();
     };
}