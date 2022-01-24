export class ParameterExpectedRootEmptyError extends Error {
    constructor(m?: string) {
        super(m);
        //Object.setPrototypeOf(this, ParameterMissingError.prototype);
    }
}
