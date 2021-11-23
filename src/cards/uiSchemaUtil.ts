import i18n from '../dialogs/locales/i18nConfig';
// In practice you'll probably get this from a service

export const TextBlock = (text:string) => {
  return {
   '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
   'type': 'AdaptiveCard',
     'version': '1.0',
     'body': [
     {
       'type': 'TextBlock',
       'text': `${text}`,
       'wrap': true,
       'fontType': 'default'
     }
   ]
 }
};

export const TwoTextBlock = (one, two) => {
  return {
  '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
  'type': 'AdaptiveCard',
    'version': '1.0',
    'body' : [
      {
        'type': 'TextBlock',
        'text': `${one}`,
        'wrap': true
      },
      {
        'spacing' : 'medium',
        'type': 'TextBlock',
        'text': `${two}`,
        'wrap': true
      }
    ]
  }
};

