// State machine to track a users progression through
// the callback bot dialog conversation flow

export class CallbackBotDetails {
  public masterError;
  public confirmCallbackStep;
  public directDepostErrorCallback;
  public confirmCallbackDetailsStep;
  public getUserPhoneNumberStep;
  public confirmAuthWordStep;
  public getUserEmailStep;
  public errorCount;
  public getPreferredCallbackDateAndTimeStep;
  public getPreferredMethodOfContactStep;
  public phoneNumber;
  public date;
  public time;
  public authCode;
  public confirmConfirmationStep;
  public confirmEmailStep;
  public confirmPhoneStep;
  public preferredEmail;
  public preferredText;
  public preferredEmailAndText;
  constructor() {
    // Master error - flag that is thrown when we hit a critical error in the conversation flow
    this.masterError = null;

    this.confirmCallbackStep = null;
    this.directDepostErrorCallback = null;
    this.preferredEmail = null;
    this.preferredText = null;
    this.preferredEmailAndText = null;
    this.getPreferredCallbackDateAndTimeStep = null;
    this.getUserPhoneNumberStep = null;
    this.getUserEmailStep = null;
    this.confirmAuthWordStep = null;
    this.confirmConfirmationStep = null;
    this.getPreferredMethodOfContactStep = null;
    this.confirmEmailStep = null;
    this.confirmPhoneStep = null;
    this.confirmCallbackDetailsStep = null;
    this.date = '';
    this.phoneNumber = '';
    this.time = '';
    this.authCode = '';

    // State machine that stores the error counts of each step
    this.errorCount = {
      confirmCallbackStep: 0,
      getUserPhoneNumberStep: 0,
      getPreferredCallbackDateAndTimeStep: 0,
      confirmCallbackDetailsStep: 0,
      confirmAuthWordStep: 0,
      getUserEmailStep: 0,
      confirmConfirmationStep: 0,
      getPreferredMethodOfContactStep: 0,
      confirmEmailStep: 0,
      confirmPhoneStep: 0
    };
  }

  public toString = () =>
    JSON.stringify(
      Object.assign(
        {},
        {
          phoneNumber: this.phoneNumber,
          date: this.date,
          time: this.time,
          authCode: this.authCode
        },
      ),
      null,
      '  '
    );
}
