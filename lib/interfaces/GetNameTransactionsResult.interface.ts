export enum GetNameTransactionsResultEnum { 
    NOT_IMPLEMENTED = 0,
    FETCH_ERROR = 1,
}
export interface GetNameTransactionsResult { 
    result: GetNameTransactionsResultEnum
    rawtxs: string[]
}