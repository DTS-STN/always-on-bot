import { MessageFactory, CardFactory } from 'botbuilder';

export { whatNumbersToFindSchema, howToFindNumbersSchema, saveConfirmationSchema } from './uiSchemaDirectDeposit'
export { lookupAddSchema, lookupUpdateSchema } from './uiSchemaLookup'
export { TextBlock } from './uiSchemaUtil'

// Helper function to attach adaptive card.
export function addACard(schema:any): any {
	let card:any;
	let message:any;

	card = CardFactory.adaptiveCard(schema);
	return message = MessageFactory.attachment(card);
}