// State machine to track a users progression through
// the unblockbot dialog conversation flow

export class UnblockBotDetails {
  public masterError;
  public confirmLookIntoStep;
  public confirmHomeAddressStep;
  public errorCount;

  constructor() {
    // Master error - flag that is thrown when we hit a critical error in the conversation flow
    this.masterError = null;

    // [STEP 1] Flag that confirms the user wants us to look into their file
    this.confirmLookIntoStep = null;

    // [STEP 2] Flag that confirms the user wants us to send an email
    this.confirmHomeAddressStep = null;

    // State machine that stores the error counts of each step
    this.errorCount = {
      confirmLookIntoStep: 0,
      confirmHomeAddressStep: 0,
    };
  }
}
