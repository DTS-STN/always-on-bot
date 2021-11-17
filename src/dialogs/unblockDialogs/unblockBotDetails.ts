// State machine to track a users progression through
// the unblockbot dialog conversation flow

export class UnblockBotDetails {
  public masterError;
  public confirmLookIntoStep;
  public unblockDirectDeposit;
  public errorCount;

  constructor() {
    // Master error - flag that is thrown when we hit a critical error in the conversation flow
    this.masterError = null;

    // [STEP 1] Confirms path forward after initial bot block query
    this.confirmLookIntoStep = null;

    // [STEP 2] Requests they unblock their direct deposit
    this.unblockDirectDeposit = null;

    // State machine that stores the error counts of each step
    this.errorCount = {
      confirmLookIntoStep: 0,
      unblockDirectDeposit: 0
    };
  }
}
