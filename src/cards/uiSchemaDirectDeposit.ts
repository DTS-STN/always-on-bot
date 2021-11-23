import i18n from '../dialogs/locales/i18nConfig';
// In practice you'll probably get this from a service

export const standardMsgSchema = (standardMsg:any) => {
  return {
   '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
   'type': 'AdaptiveCard',
     'version': '1.0',
     'body': [
     {
       'type': 'TextBlock',
       'text': `${standardMsg}`,
       'wrap': true,
       'fontType': 'default'
     },
     {'type': 'FactSet',
       'facts': [
        {
          'title': '1',
          'value': `${i18n.__('unblock_direct_deposit_transit_name')}`
        },
        {
          'title': '2',
          'value': `${i18n.__('unblock_direct_deposit_instition_name')}`
        },
        {
          'title': '3',
          'value': `${i18n.__('unblock_direct_deposit_account_name')}`
        }
       ]
     }
   ]
 }
};

export const infoMsgSchema = (infoMsg:any) => {
  return {
  '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
  'type': 'AdaptiveCard',
    'version': '1.0',
    'body' : [
      {
        'type': 'TextBlock',
        'text': `${infoMsg}`,
        'wrap': true,
        'fontType': 'default'
      },
      {
        'type': 'Image',
        'url': 'https://wornertcouture.ca/assets/cheque-visual.svg'
      }
    ]
  }
};

