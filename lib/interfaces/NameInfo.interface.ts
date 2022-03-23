import { Record } from "./Record.interface.ts";

export interface NameInfo { 
    owner: string;
    records: {
        [type: string]: {
            [key: string]: Record;
        }
    }
}