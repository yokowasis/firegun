import Gun from "gun";
import Firegun from "./firegun";

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

export const common = {
    /**
     * Generate Public Certificate for Logged in User
     * @returns 
     */
     async generatePublicCert(fg:Firegun) : Promise<{data : Ack[],error : Ack[]}> {
        return new Promise(async (resolve, reject) => {
            if (fg.user.alias) {
                // BUG Blacklist Work Around
                // await fg.userPut("chat-blacklist",{
                //     "t" : "_"
                // })
                
                let cert = await (Gun as any).SEA.certify("*", [{ "*" : "chat-with","+" : "*"}], fg.user.pair,null,{
                    // block : 'chat-blacklist' //ADA BUG DARI GUN JADI BELUM BISA BLACKLIST
                });
                let ack = await fg.userPut("chat-cert",cert);
                resolve (ack);    
            } else {
                reject ("User belum Login")
            }
        });
    },

    dynamicSort : (property:string) => {
        var sortOrder = 1;
        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a : any,b : any) {
            /* next line works with strings and numbers, 
             * and you may want to customize it to your needs
             */
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    }
    
}
