export class ParameterListInsufficientSpendError extends Error {
    constructor(m?: string) {
        super(m);
    }
    toString() {
        return 'ParameterListInsufficientError';
    }
}
