import { RequiredTransactionPartialResult } from "../interfaces/RequiredTransactionPartialResult.interface";

export class MissingNextTransactionError extends Error {
    constructor(public requiredTransactionPartialResult: RequiredTransactionPartialResult) {
        super();
    }
}
