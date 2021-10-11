const Gun = require("gun")

import 'gun/sea';
import 'gun/lib/load';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';
import { IGunChainReference } from "gun/types/chain";
import { IGunCryptoKeyPair } from "gun/types/types";

function dynamicSort(property:string) {
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

function randomAlphaNumeric(length:number):string {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;        
}

interface FiregunUser {
    alias : string,
    pair : {
        priv : string,
        pub : string,
        epriv : string,
        epub : string
    }
    err? : any
}

type Ack = { 
    "@"?: string,
    err: undefined,
    ok: { "": number } | string,
    "#"?: string 
} | {
    err: Error,
    ok: any
} | void;

interface Pubkey {
    pub: string,
    epub?: string,
}

export class Firegun {

    prefix : string;
    gun : IGunChainReference;
    user : FiregunUser;
    ev : {
        [key:string] : {
            handler : any
        }
    }

    /**
     * 
     * --------------------------------------
     * Create Firegun Instance
     * 
     * @param peers list of gun Peers, default : []
     * @param dbname dbName, default : "fireDB"
     * @param localstorage whether to use localstorage or not (indexedDB)
     * @param prefix node prefix, default : "" (no prefix)
     * @param axe join axe network, default : false
     * @param port multicast port, default : 8765
     * @param gunInstance use an existing gunDB instance, default : null
     */
    constructor(
        peers: string[] = [],
        dbname: string = "fireDB",
        localstorage: boolean = false,
        prefix: string = "",
        axe: boolean = false,
        port: number = 8765,
        gunInstance: (IGunChainReference | null) = null) {

        this.prefix = prefix;

        if (gunInstance) {
            this.gun = gunInstance;
        } else {
            this.gun = Gun({
                file : dbname,
                localStorage : localstorage,
                axe : axe,
                multicast : {
                    port : port
                },
                peers : peers
            })    
        }
        
        this.user = {
            alias : "",
            pair : {
                priv : "",
                pub : "",
                epriv : "",
                epub : ""
            }
        };
        this.ev = {};
    }
    /**
     * Wait in ms
     * @param ms duration of timeout in ms
     * @returns 
     */
    async _timeout (ms : number) : Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Delete On Subscription
     * @param ev On subscription name, default : "default"
     */
    async Off (ev = "default") {
        if (this.ev[ev] && this.ev[ev].handler) {
            this.ev[ev].handler.off();
        } else {
            this.ev[ev] = {
                handler : null
            }
        }
    }

    /**
     * New subscription on Path. When data on Path changed, callback is called.
     * 
     * @param path node path
     * @param callback callback
     * @param ev On name as identifier, to be called by Off when finished
     * @param different Whether to fetch only differnce, or all of nodes
     * @param prefix node prefix, default : ""
     */
    async On (path: string,callback: ({ }) => void,ev: string = "default", different: boolean=true,prefix: string =this.prefix) : Promise<void> {
        path = `${prefix}${path}`;
        let paths = path.split("/");
        let dataGun = this.gun;
        
        paths.forEach(path => {
            dataGun = dataGun.get(path);
        });

        let listenerHandler = (value : any, key : any , _msg : any, _ev : any) => {
             this.ev[ev] = {
                handler : _ev
            }
            if (value)
                callback(JSON.parse(JSON.stringify(value)))
        }
    
        // @ts-ignore
        dataGun.on(listenerHandler,{ change : different});
    }        
    
    /**
     * ----------------------------------
     * Insert CONTENT-ADDRESSING Readonly Data.
     * 
     * dev note : Sebenarnya bisa tambah lagi searchable path dengan RAD, 
     * hanya saja RAD masih Memiliki BUG, dan tidak bekerja secara consistent
     * @param key must begin with #
     * @param data If object, it will be stringified automatically
     * @returns
     */
     async addContentAdressing (key: string,data: (string | {})): Promise<Ack> {
        if (typeof data === "object") {
            data = JSON.stringify(data);
        }
        let hash = await Gun.SEA.work(data, null, undefined, {name: "SHA-256"});
        return new Promise((resolve) => {
            if (hash)
            this.gun.get(`${key}`).get(hash).put(<any>data,(s)=>{
                resolve(<Ack>s);
            });
        });        
    }
    
    /**
     * Generate Key PAIR from SEA module
     * @returns
     */
    async generatePair (): Promise<IGunCryptoKeyPair | undefined> {
        return new Promise(async function (resolve) {
            resolve (await Gun.SEA.pair());
        });        
    }

    /**
     * 
     * Login using SEA Pair Key, instead of using username and Password
     * 
     * @param pair SEA Key Pair
     * @param alias if ommited, the value is Anonymous
     * @returns 
     */
     async loginPair (pair: CryptoKeyPair ,alias: string="Anonymous"): Promise<({ err: Error; } | FiregunUser )> {
        return new Promise((resolve,reject)=>{
            this.gun.user().auth(pair,(s=>{
                if ("err" in s) {
                    this.userLogout()
                    reject (s.err)
                } else {
                    this.user = {
                        alias : alias,
                        pair : s.sea,
                    }
                    resolve(this.user);
                }
            }));
        });
    }
    
    /**
     * 
     * Create a new user and Log him in
     * 
     * @param username 
     * @param password 
     * @returns
     */
    async userNew (username: string, password: string): Promise<{ err: string } | FiregunUser > {
        return new Promise((resolve,reject)=>{
            this.gun.user().create(username,password,async (s)=>{
                if ("err" in s) {
                    reject(s);
                } else {
                    this.gun.user().leave();
                    let user = await this.userLogin(username,password);
                    if ("err" in user) {
                        reject (user);
                    } else {
                        resolve(this.user);
                    }
                }
            });
        })        
    }

    /**
     * 
     * Log a user in
     * 
     * @param username 
     * @param password 
     * @param repeat time to repeat the login before give up. Because the nature of decentralization, just because the first time login is failed, doesn't mean the user / password pair doesn't exist in the network
     * @returns 
     */
    async userLogin (username: string, password: string, repeat: number=2): Promise<{err : string} | FiregunUser> {
        return new Promise((resolve,reject)=>{
            this.gun.user().auth(username,password,async (s)=>{
                if ("err" in  s) {
                    if (repeat>0) {
                        await this._timeout(1000);
                        this.userLogin(username,password,repeat-1)
                        .then(s=>{
                            resolve(s)
                        })
                        .catch(s=>{
                            reject(s);
                        })
                    } else {
                        reject(s);
                        this.userLogout()
                    }                    
                } else {
                    this.user = {
                        alias : username,
                        pair : s.sea,
                    }
                    resolve(this.user);    
                }
            })
        });
    }

    /**
     * Log the user out
     */
    async userLogout () {
        this.gun.user().leave();
        this.user = {
            alias : "",
            pair : {
                priv : "",
                pub : "",
                epriv : "",
                epub : ""
            }
        };
    }

    /**
     * 
     * Fetch data from userspace
     * 
     * @param path node path
     * @param repeat time to repeat fetching before returning undefined
     * @param prefix Database Prefix
     * @returns
     */
    async userGet (path: string,repeat: number = 1,prefix: string=this.prefix): Promise<{} | undefined> {
        if (this.user.alias) {
           path = `~${this.user.pair.pub}/${path}`
           return (await this.Get(path,repeat,prefix));
        } else {
            return undefined;
        }
    }

    /**
     * Load Multi Nested Data From Userspace
     * @param path node path
     * @param repeat time to repeat fetching before returning undefined
     * @param prefix Database Prefix
     * @returns
     */
    async userLoad (path: string,async=false, repeat: number = 1,prefix: string=this.prefix): Promise<{[key : string] : any} | undefined> {
        if (this.user.alias) {
           path = `~${this.user.pair.pub}/${path}`
           return (await this.Load(path,async=false, repeat,prefix));
        } else {
            return undefined;
        }
    }

    /**
     * 
     * Fetching data
     * 
     * @param {string} path node path
     * @param {number} repeat time to repeat fetching before returning undefined
     * @param {string} prefix Database Prefix
     * @returns
     */
    async Get (path: string,repeat: number = 1,prefix: string=this.prefix): Promise<undefined | {[key:string] : {}}> {
        let path0 = path;
        path = `${prefix}${path}`;
        let paths = path.split("/");
        let dataGun = this.gun;
        
        paths.forEach(path => {
            dataGun = dataGun.get(path);
        });
        
        return new Promise((resolve,reject) => {
            setTimeout(() => {
                reject({ err : "timeout", ket : `TIMEOUT, Possibly Data : ${path} is corrupt`, data : {}, "#" : path});
            }, 5000);
            dataGun.once(async (s)=>{
                if (s) {
                    s = JSON.parse(JSON.stringify(s));
                    resolve(s);
                } else {
                    if (repeat) {
                        await (this._timeout(1000))
                        try {
                            let data = await this.Get(path0,repeat-1,prefix)
                            resolve (data);
                        } catch (error) {
                            reject (error)
                        }                        
                    } else {
                        reject({ err : "notfound", ket : `Data Not Found,  Data : ${path} is undefined`, data : {}, "#" : path});
                    }
                }                
            })            
        });
    }

    /**
     * 
     * Put data on userspace
     * 
     * @param path 
     * @param data 
     * @returns
     */
    async userPut (path: string,data: (string | {[key:string] : {}}),async=false, prefix=this.prefix): Promise<{data : Ack[],error : Ack[]}> {
        return new Promise(async (resolve, reject) => {
            if (this.user.alias) {
                path = `~${this.user.pair.pub}/${path}`
                resolve (await this.Put(path,data,async, prefix));
             } else {
                reject (<Ack>{err : new Error("User Belum Login") , ok : undefined});
             }     
        });
    }


    /**
     * Insert new Data into a node with a random key
     * 
     * @param path 
     * @param data 
     * @param prefix 
     * @param opt 
     * @returns 
     */
    async Set (path: string,data: {[key : string] : {}} ,async=false, prefix=this.prefix,opt : undefined | { opt: { cert: string; }; }=undefined) : Promise<{data : Ack[],error : Ack[]}> {
        return new Promise(async (resolve, reject) => {
            var token = randomAlphaNumeric(30);
            data.id = token;
            this.Put(`${path}/${token}`,data,async,prefix,opt)
            .then(s=>{
                resolve(s);
            })
        })
    }

    /**
     * ----------------------------
     * Put Data to the gunDB Node
     * 
     * @param path node path
     * @param data data to put
     * @param prefix node prefix
     * @param opt option (certificate)
     * @returns 
     */
    async Put (path: string,data: (string | {[key:string] : {} | string}),async = false, prefix: string=this.prefix,opt:undefined | { opt : { cert : string} }=undefined): Promise<{data : Ack[],error : Ack[]}> {
        path = `${prefix}${path}`;
        if (async) { console.log(path) }
        let paths = path.split("/");
        let dataGun = this.gun;

        paths.forEach(path => {
            dataGun = dataGun.get(path);
        });

        if (typeof data === "undefined") {
            data = { "t" : "_" }
        }
        let promises : Promise<Ack>[] = [];
        if (typeof data === "object")
        var obj:{data : Ack[],error : Ack[]} = { data: [] , error : []};
        if (typeof data == "object")
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                const element = data[key];
                if (typeof element === "object") {
                    delete data[key];
                    if (async) {
                        let s = await this.Put(`${path}/${key}`,element,async)
                        obj.data = [...obj.data, ...s.data]
                        obj.error = [...obj.error, ...s.error]
                    } else {
                        promises.push(
                            this.Put(`${path}/${key}`,element,async)
                            .then(s=>{
                                obj.data = [...obj.data, ...s.data]
                                obj.error = [...obj.error, ...s.error]
                            })
                        )    
                    }
                }
            }
        }
        
        return new Promise((resolve,reject)=>{
           Promise.allSettled(promises)
            .then(s=>{
                // Handle Empty Object
                if (data && Object.keys(data).length === 0) {
                    resolve (obj)
                } else {
                    setTimeout(() => {
                        obj.error.push({ err : Error("TIMEOUT, Failed to put Data"), ok : path});
                        resolve (obj);
                    }, 10);
                    dataGun.put(<any>data,(ack)=>{
                        if (ack.err === undefined) {
                            obj.data.push(ack);
                        } else {
                            obj.error.push({ err : Error(JSON.stringify(ack)), ok : path});
                        }
                        resolve(obj);
                    },opt)
                }
            })
            .catch(s=>{
                obj.error.push({ err : Error(JSON.stringify(s)), ok : path});
                resolve(obj)
            })
        });
    }

    /**
     * Delete node Path. It's not really deleted. It's just detached (tombstone). Data without parent.
     * @param path 
     * @returns 
     */
    async Del (path : string) : Promise<{data : Ack[],error : Ack[]}> {
        return new Promise(async (resolve, reject) => {
            var token = randomAlphaNumeric(30);            
            this.Put(`${path}`,{
                "#" : token,
                "t" : "_"
            })
            .then(s=>{
                resolve(s);
            })
        })        
    }

    /**
     * Load Multi Nested Data
     * @param path 
     * @param repeat time to repeat fetching before returning undefined
     * @param prefix node Prefix
     * @returns 
     */
    async Load (path: string,async=false,repeat: number = 1,prefix: string=this.prefix) : Promise<{data : {[s:string] : {}}, err : {path : string, err : string}[]}> {
        console.log(path);
        return new Promise((resolve, reject) => {
            let promises :Promise<any>[] = []
            let obj : {data : {[s:string] : {}}, err : {path : string, err : string}[]} = { data : {}, err : []};
            this.Get(path,repeat,prefix)
            .then(async (s)=>{
                for (const key in s) {
                    if ( key != "_" && key != "#" && key != ">" ) {
                        const element = s[key];
                        if (typeof element === "object") {
                            if (async) {
                                try {
                                    let s = await <any>this.Load(`${path}/${key}`,async);
                                    obj.data[key] = s;
                                } catch (error) {
                                    obj.err.push(error)
                                }
                            } else {
                                promises.push(this.Load(`${path}/${key}`,async).then(s=>{
                                    obj.data[key] = s;
                                })
                                .catch(s=>{
                                    obj.err.push(s)
                                })
                                );    
                            }
                        } else {
                            obj.data[key] = element;
                        }
                    }
                }
                Promise.allSettled(promises)
                .then(s=>{
                    resolve(obj);
                })
                .catch(s=>{
                    obj.err.push(s)
                    resolve(obj);
                })
            })
            .catch(s=>{
                obj.err.push(s)
                resolve(obj);
            })
        });
    }
}

export class Chat {

    firegun : Firegun
    user : FiregunUser

    /**
     * Init Chat Class
     * @param {Firegun} firegun Firegun instance
     */
    constructor(firegun: Firegun) {
        this.firegun = firegun;
        this.user = this.firegun.user;        
    }

    /**
     * Generate Public Certificate for Logged in User
     * @returns 
     */
    async generatePublicCert() : Promise<{data : Ack[],error : Ack[]}> {
        return new Promise(async (resolve, reject) => {
            if (this.firegun.user.alias) {
                // BUG Blacklist Work Around
                // await this.firegun.userPut("chat-blacklist",{
                //     "t" : "_"
                // })
                
                // @ts-ignore
                let cert = await Gun.SEA.certify("*", [{ "*" : "chat-with","+" : "*"}], this.firegun.user.pair,null,{
                    // block : 'chat-blacklist' //ADA BUG DARI GUN JADI BELUM BISA BLACKLIST
                });
                let ack = await this.firegun.userPut("chat-cert",cert);
                resolve (ack);    
            } else {
                reject ("User belum Login")
            }
        });
    }

    /**
     * --------------------
     * Retrieving chats
     * @param pubkey 
     * @param date 
     * @returns
     */
    async retrieve(pubkey: Pubkey, date : string[] = []) {
        if (!this.firegun.user.alias) {
            return new Promise(async (resolve, reject) => {
                reject("User Belum Login")
            });
        } else {
            console.log ("RETRIEVING ...");
            let data : {[key:string] : any} | undefined = await this.firegun.userLoad(`chat-with/${pubkey.pub}/${date.join("/")}`);
            let sortedData : {}[] = [];
            console.log ("DONE !!");
            for (const key in data) {
                if (Object.hasOwnProperty.call(data, key)) {
                    if (pubkey.epub) {
                        if (data[key]._self) {
                            data[key].msg = await Gun.SEA.decrypt(data[key].msg, this.firegun.user.pair);
                        } else {
                            // @ts-ignore
                            data[key].msg = await Gun.SEA.decrypt(data[key].msg, await Gun.SEA.secret(pubkey.epub, this.firegun.user.pair));
                        }
                    }
                }
                sortedData.push(data[key]);
            }
            sortedData.sort(dynamicSort("timestamp"));
            return new Promise(async (resolve, reject) => {
                resolve(sortedData);
            });
            
        }
    }

    /**
     * 
     * Send Chat Message
     * 
     * @param pairkey 
     * @param msg 
     * @returns
     */
    async send(pairkey: Pubkey,msg: string): Promise<string> {
        if (!this.firegun.user.alias) {
            return new Promise(async (resolve, reject) => {
                reject("User Belum Login")
            });
        } else
        return new Promise(async (resolve, reject) => {
            let msgToHim, msgToMe;
            if (pairkey.epub) {
                // @ts-ignore
                msgToHim = await Gun.SEA.encrypt(msg,await Gun.SEA.secret(pairkey.epub,this.firegun.user.pair));
                msgToMe = await Gun.SEA.encrypt(msg,this.firegun.user.pair);
            } else {
                msgToHim = msg
            }
            let cert = <string><unknown>await this.firegun.Get(`~${pairkey.pub}/chat-cert`);
            let currentdate = new Date(); 
            let year = currentdate.getFullYear();
            let month  = ((currentdate.getMonth()+1) < 10) ? "0" + (currentdate.getMonth()+1) : (currentdate.getMonth()+1);
            let date = (currentdate.getDate() < 10) ? "0" + (currentdate.getDate()) : (currentdate.getDate());
            let hour = (currentdate.getHours() < 10) ? "0" + (currentdate.getHours()) : (currentdate.getHours());
            let minutes = (currentdate.getMinutes() < 10) ? "0" + (currentdate.getMinutes()) : (currentdate.getMinutes());
            let seconds = (currentdate.getSeconds() < 10) ? "0" + (currentdate.getSeconds()) : (currentdate.getSeconds());
            let datetime = `${year}/${month}/${date}@${hour}:${minutes}:${seconds}`;
           
            let promises = [];

            // Harus await, entah kenapa. Kalau tidak await tidak bisa.

            // Put to Penerima userspace/chat-with/publickey/year/month/day * 2, Pengirim dan Penerima
            promises.push(
                await this.firegun.Set(`~${pairkey.pub}/chat-with/${this.firegun.user.pair.pub}/${year}/${(month)}/${date}`,{
                    "_self" : false,
                    "timestamp" : datetime, 
                    "msg" : msgToHim, 
                    "status" : "sent"
                },true, undefined,{
                    opt : {
                        cert : cert
                    }
                })
            );
            // Put to My userspace/chat-with/publickey/year/month/day * 2, Pengirim dan Penerima
            promises.push(
                await this.firegun.Set(`~${this.firegun.user.pair.pub}/chat-with/${`${pairkey.pub}`}/${year}/${month}/${date}`,{
                    "_self" : true,
                    "timestamp" : datetime, 
                    "msg" : msgToMe, 
                    "status" : "sent"
                })
            )
            
            Promise.all(promises)
            .then(s=>{
                resolve("OK");
            })
            .catch(err=>{
                reject(err);
            })
        });
    }

    /**
     * 
     * Send Group Chat Message
     * 
     * @param groupowner 
     * @param groupname 
     * @param msg 
     * @returns 
     */
    async groupSend(groupowner: Pubkey,groupname: string,msg: string) : Promise<{data : Ack[],error : Ack[]}> {
        return new Promise(async (resolve, reject) => {
            let cert = <string><unknown>await this.firegun.Get(`~${groupowner.pub}/chat-group/${groupname}/cert`);
            let currentdate = new Date(); 
            let datetime =  currentdate.getDate() + "/"
                            + (currentdate.getMonth()+1)  + "/" 
                            + currentdate.getFullYear() + " @ "  
                            + currentdate.getHours() + ":"  
                            + currentdate.getMinutes() + ":" 
                            + currentdate.getSeconds();
           
            // Put to Penerima userspace/chat-with/publickey/year/month/day * 2, Pengirim dan Penerima
            this.firegun.Set(`~${groupowner.pub}/chat-group/${groupname}/chat/${currentdate.getFullYear()}/${(currentdate.getMonth()+1)}/${currentdate.getDate()}/${this.firegun.user.pair.pub}`,{
                "_self" : false,
                "timestamp" : datetime, 
                "msg" : msg, 
                status : "sent"
            },true, undefined,{
                opt : {
                    cert : cert
                }
            })
            .then(s=>{
                resolve(s)
            })
            .catch(err=>{
                reject(err)
            })
        });
    }

    /**
     * --------------------
     * New Group Chat
     * 
     * @param groupname 
     */
     async groupNew(groupname: string) : Promise<string> {
        // /userspace/chat-group/groupname/cert
        if (this.firegun.user.alias) {
            return new Promise(async (resolve, reject) => {
                let promises:any[] = [];
                promises.push(this.firegun.userPut(`chat-group/${groupname}/info/name`,groupname))
                promises.push(this.firegun.userPut(`chat-group/${groupname}/members`,JSON.stringify([])));
                Promise.allSettled(promises)
                .then(s=>{
                    resolve("OK");
                })
                .catch(s=>{
                    console.log(s);
                    reject(s);
                })
            });
        } else {
            return "User not Logged in"
        }
    }

    /**
     * --------------------------------
     * Update Group Certificate
     * 
     * @param groupname
     */
    async groupUpdateCert(groupname : string) : Promise<{data : Ack[],error : Ack[]}> {
        // BUG Blacklis Work Around
        // await this.firegun.userPut(`chat-group/${groupname}/banlist`,{
        //     "t" : "_"
        // })
        
        let members = JSON.parse(<string>await this.firegun.userGet(`chat-group/${groupname}/members`));
        // @ts-ignore
        let cert = await Gun.SEA.certify(members, [{ "*" : `chat-group/${groupname}/chat`,"+" : "*"}], this.firegun.user.pair,null,{
            // block : `chat-group/${groupname}/banlist` //ADA BUG DARI GUN JADI BELUM BISA BLACKLIST
        });
        return new Promise(async (resolve, reject) => {
            this.firegun.userPut(`chat-group/${groupname}/cert`,cert)
            .then(s=>{
                resolve(s);
            })
            .catch(err=>{
                reject(err);    
            })    
        });
    }

    /**
     * -----------------------------
     * Invite new member to group
     * 
     * @param groupname
     * @param pairkey 
     */
    async groupInvite(groupname: string, pairkey: Pubkey) {
        let members = JSON.parse(<string>await this.firegun.userGet(`chat-group/${groupname}/members`));
        members.push(pairkey.pub);
        let res = await this.firegun.userPut(`chat-group/${groupname}/members`,JSON.stringify(members))
        return (res);
    }

    /**
     * -------------------------
     * Set group Info
     * 
     * @param groupname 
     * @param info 
     */
    async groupSetInfo(groupname : string, info: { pict: string; desc: string; } = {pict : "", desc: ""}) : Promise<void> {
        if (info.pict) {
            this.firegun.userPut(`chat-group/${groupname}/info/pict`,info.pict)
        }
        if (info.desc) {
            this.firegun.userPut(`chat-group/${groupname}/info/desc`,info.desc)
        }
    }

    /**
     * Group Get Info
     * 
     * @param groupname 
     * @returns 
     */
    async groupGetInfo(groupname : string) {
        let data = await this.firegun.userGet(`chat-group/${groupname}/info`);
        return (data)        
    }

    async groupBan() {

    }

    async groupInviteAdmin() {

    }

    async groupBanAdmin() {

    }

}
