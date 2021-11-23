import i18n from '../dialogs/locales/i18nConfig';
// In practice you'll probably get this from a service
export const whatNumbersToFindSchema = () => {
  return {
   '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
   'type': 'AdaptiveCard',
     'version': '1.0',
     'body': [
     {
       'type': 'TextBlock',
       'text': `${i18n.__('unblock_direct_deposit_msg')}`,
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

export const howToFindNumbersSchema = () => {
  return {
  '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
  'type': 'AdaptiveCard',
    'version': '1.0',
    'body' : [
      {
        'type': 'TextBlock',
        'text': `${i18n.__('unblock_direct_deposit_how_to_cheques')}`,
        'wrap': true
      },
      {
        'spacing' : 'medium',
        'type': 'TextBlock',
        'text': `${i18n.__('unblock_direct_deposit_how_to_bank')}`,
        'wrap': true
      },
      {
        'spacing' : 'large',
        'type': 'Image',
        'url': 'https://wornertcouture.ca/assets/cheque-visual.svg'
      }
    ]
  }
};

export const saveConfirmationSchema = () => {
  return {
  '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
  'type': 'AdaptiveCard',
    'version': '1.0',
    'body' : [
      {
        'type': 'TextBlock',
        'text': `${i18n.__('unblock_direct_deposit_valid_msg')}`,
        'wrap': true
      },
      {
        'spacing' : 'medium',
        'type': 'TextBlock',
        'text': `${i18n.__('unblock_direct_deposit_valid_tip')}`,
        'wrap': true
      }
    ]
  }
};

