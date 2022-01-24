export class ParameterListEmptyError extends Error {
    constructor(m?: string) {
        super(m);
        //Object.setPrototypeOf(this, ParameterMissingError.prototype);
    }
}
