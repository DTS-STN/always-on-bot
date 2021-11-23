/**
 * Copyright(c) Microsoft Corporation.All rights reserved.
 * Licensed under the MIT License.
 */
 import { MessageFactory, CardFactory } from 'botbuilder';

// Helper function to generate an UUID.
// Code is from @stevenic: https://github.com/stevenic
export function uuid(): string {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c): string => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper function to attach adaptive card.
export function addACard(schema:any): any {
    let card:any;
    let message:any;

    card = CardFactory.adaptiveCard(schema);
    return message = MessageFactory.attachment(card);
}