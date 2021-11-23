import i18n from '../dialogs/locales/i18nConfig';
// In practice you'll probably get this from a service

export const welcomeSchema = () => {
  return {
   '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
   'type': 'AdaptiveCard',
     'version': '1.0',
     'body': [
     {
       'type': 'TextBlock',
       'text': `${i18n.__('unblockLookup_welcome_msg')}`,
       'wrap': true,
       'fontType': 'default'
     }
   ]
 }
};
