export class DirectDepositChequePromptDetails {
    public promptType: string;
    public resultText: string;
    public isValidResult: boolean;
    public numberLength: number;

    constructor(type: string) {
        this.isValidResult = false;
        switch (type) {
            case 'TransitNumber':
                this.promptType = type;
                this.numberLength = 5;
                break;
            case 'AccountNumber':
                this.promptType = type;
                this.numberLength = 7;
                break;
            case 'InstitutionNumber':
                this.promptType = type;
                this.numberLength = 3;
                break;
            default:
                this.promptType = '';
                this.numberLength = 0;
                break;
        }
    }
}