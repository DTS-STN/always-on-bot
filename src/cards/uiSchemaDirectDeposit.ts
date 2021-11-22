import i18n from '../dialogs/locales/i18nConfig';

export const inlineFormSchema = (standardMsg:any,infoMsg:any ) => {
  return {
    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
    'type': 'AdaptiveCard',
      'version': '1.0',
      'body': [
      {
        'type': 'TextBlock',
        'text': `${standardMsg}`,
        'wrap': true
      },
      {'type': 'FactSet',
        'facts': [
          {
            'title': '1',
            'value': `${i18n.__('unblock_direct_deposit_instition_name')}`
          },
          {
            'title': '2',
            'value': `${i18n.__('unblock_direct_deposit_transit_name')}`
          },
          {
            'title': '3',
            'value': `${i18n.__('unblock_direct_deposit_account_name')}`
          }
        ]
      },
      {
        'type': 'TextBlock',
        'text': `${infoMsg}`,
        'wrap': true
      },
      {
        'type': 'Input.Text',
        'label': `${i18n.__('unblock_direct_deposit_instition_name')}`,
        'maxLength': 3,
        'placeholder' : `${i18n.__('unblock_direct_deposit_institute')}`,
        'id': 'instituteNumber',
        'errorMessage': `${i18n.__('unblock_direct_deposit_institute_retry')}`,
        'regex' : '^[0-9]{3}$',
        'isRequired': true
      },
      {
        'label': `${i18n.__('unblock_direct_deposit_transit_name')}`,
        'type': 'Input.Text',
        'maxLength': 5,
        'id': 'transitNumber',
        'placeholder' : `${i18n.__('unblock_direct_deposit_transit')}`,
        'errorMessage': `${i18n.__('unblock_direct_deposit_transit_retry')}`,
        'regex' : '^[0-9]{5}$',
        'isRequired': true
      },
      {
        'type': 'Input.Text',
        'label': `${i18n.__('unblock_direct_deposit_account_name')}`,
        'maxLength': 7,
        'id': 'accountNumber',
        'placeholder' : `${i18n.__('unblock_direct_deposit_account')}`,
        'errorMessage': `${i18n.__('unblock_direct_deposit_account_retry')}`,
        'regex' : '^[0-9]{7}$',
        'isRequired': true
      }
    ],
    'actions': [
      {
        'type': 'Action.Submit',
        'title': 'Submit my bank information',
        'data': {
          'id': '1234567890'
        }
      },
      {
        'type': 'Action.ShowCard',
        'title': 'Where do I find these numbers?',
        'tooltip' : 'Click here to see where the numbers are',
        'card': {
          'type': 'AdaptiveCard',
          'body': [
            {
              'type': 'TextBlock',
              'text': `${i18n.__('unblock_direct_deposit_how_to')}`,
              'wrap': true
            },
            {
              'type': 'Image',
              'url': 'https://wornertcouture.ca/assets/cheque-visual.svg'
            }
          ]
        }
      }
    ]
  }
};

export const standardMsgSchema = (standardMsg:any) => {

  // In practice you'll probably get this from a service
  // see http://adaptivecards.io/samples/ for inspiration

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
          'value': `${i18n.__('unblock_direct_deposit_instition_name')}`
        },
        {
          'title': '2',
          'value': `${i18n.__('unblock_direct_deposit_transit_name')}`
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

export const actionMsgSchema = (infoMsg:any) => {
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
      }
    ],
    'actions': [
      {
        'type': 'Action.ShowCard',
        'title': 'Where do I find these numbers?',
        'tooltip' : 'Click here to see where the numbers are',
        'card': {
          'type': 'AdaptiveCard',
          'body': [
            {
              'type': 'TextBlock',
              'text': `${i18n.__('unblock_direct_deposit_how_to')}`,
              'wrap': true
            },
            {
              'type': 'Image',
              'url': 'https://wornertcouture.ca/assets/cheque-visual.svg'
            }
          ]
        }
      }
    ]
  }
};