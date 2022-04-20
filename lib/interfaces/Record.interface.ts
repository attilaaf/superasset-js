export interface Record { 
    type: string;
    name: string;
    value: string;
}

export interface Records { 
    [key: string]: Record
}
