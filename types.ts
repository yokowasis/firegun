export declare type FiregunUser = {
    alias : string,
    pair : {
        priv : string,
        pub : string,
        epriv : string,
        epub : string
    }
    err? : any
}

export declare type Ack = { 
    "@"?: string,
    err: undefined,
    ok: { "": number } | string,
    "#"?: string 
} | {
    err: Error,
    ok: any
} | void;

export declare type Pubkey = {
    pub: string,
    epub?: string,
}

