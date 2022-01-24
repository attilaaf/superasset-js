export class ParameterMissingError extends Error {
    constructor(m?: string) {
        super(m);
        //Object.setPrototypeOf(this, ParameterMissingError.prototype);
    }
}
