import Gun from 'gun';

import 'gun/sea';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';

import { FiregunUser, Ack, common } from './common'
import { IGunChainReference } from "gun/types/chain";
import { IGunCryptoKeyPair } from "gun/types/types";
import { IGunStatic } from 'gun/types/static';

function randomAlphaNumeric(length:number):string {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;        
}

export default class Firegun {

    prefix : string;
    dbname : string;
    gun : IGunChainReference;
    Gun : IGunStatic;
    peers : string[];
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
        this.peers = peers;
        this.dbname = dbname;

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

        this.Gun = Gun;

        // Auto Login

        this.user = {
            alias : "",
            pair : {
                priv : "",
                pub : "",
                epriv : "",
                epub : ""
            }
        };
        if (typeof localStorage!== "undefined") {
            let user = localStorage.getItem("fg.keypair");
            user = user || ""
            if (user)
            try {
                let autoLoginUser = JSON.parse(user);
                this.loginPair(autoLoginUser.pair,autoLoginUser.alias)
                .then(async ()=>{
                    console.log ("Checking Certificate...")
                    try {
                        await this.userGet("chat-cert");
                        console.log ("Checking Certificate...✔")
                    } catch (error) {
                        common.generatePublicCert(this);
                    }                
                })
            } catch (error) {
            }            
        }
        
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
             if (false) {
                 console.log(key)
             }
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
        let hash = await this.Gun.SEA.work(data, null, undefined, {name: "SHA-256"});
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
        return new Promise(async (resolve) => {
            resolve (await this.Gun.SEA.pair());
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
     async loginPair (pair: IGunCryptoKeyPair ,alias: string=""): Promise<({ err: Error; } | FiregunUser )> {
        if (alias === "") {
            alias = pair.pub.slice(0,8);
        }
        return new Promise((resolve,reject)=>{
            this.gun.user().auth(pair as any,(s=>{
                if ("err" in s) {
                    this.userLogout()
                    reject (s.err)
                } else {
                    this.user = {
                        alias : alias,
                        pair : s.sea,
                    }
                    resolve(this.user);
                    localStorage.setItem("fg.keypair",JSON.stringify(this.user));
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
    async userNew (username: string, password: string,alias:string = ""): Promise<{ err: string } | FiregunUser > {
        return new Promise((resolve,reject)=>{
            this.gun.user().create(username,password,async (s)=>{
                if ("err" in s) {
                    reject(s);
                } else {
                    this.gun.user().leave();
                    let user = await this.userLogin(username,password,alias);
                    if ("err" in user) {
                        reject (user);
                    } else {
                        resolve(this.user);
                        common.generatePublicCert(this)
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
    async userLogin (username: string, password: string, alias:string = "", repeat: number=2): Promise<{err : string} | FiregunUser> {
        return new Promise((resolve,reject)=>{
            this.gun.user().auth(username,password,async (s)=>{
                if ("err" in  s) {
                    if (repeat>0) {
                        await this._timeout(1000);
                        this.userLogin(username,password,alias,repeat-1)
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
                        alias : alias || username,
                        pair : s.sea,
                    }
                    resolve(this.user);
                    if (typeof localStorage !== "undefined") {
                        localStorage.setItem("fg.keypair",JSON.stringify(this.user));
                    }                        
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
    async userGet (path: string,repeat: number = 1,prefix: string=this.prefix): Promise<string | {
        [key: string]: {};
    } | {
        [key: string]: string;
    } | undefined> {
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
    async userLoad (path: string,async=false,repeat: number = 1,prefix: string=this.prefix) : Promise<{data : {[s:string] : any}, err : {path : string, err : string}[]}> {
        if (this.user.alias) {
           path = `~${this.user.pair.pub}/${path}`
           return (await this.Load(path,async, repeat,prefix));
        } else {
            return {data : {}, err : [{path : path, err : "User not logged in"}]};
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
    async Get (path: string,repeat: number = 1,prefix: string=this.prefix): Promise<undefined | string |  {[key:string] : {}} | {[key:string] : string}> {
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
    async Set (path: string,data: {[key : string] : {}} | {[key : string] : string} ,async=false, prefix=this.prefix,opt : undefined | { opt: { cert: string; }; }=undefined) : Promise<{data : Ack[],error : Ack[]}> {
        return new Promise(async (resolve, reject) => {
            var token = randomAlphaNumeric(30);
            data.id = token;
            this.Put(`${path}/${token}`,data,async,prefix,opt)
            .then(s=>{
                resolve(s);
            })
            .catch(err=>{
                reject(err);
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
    async Put (path: string,data: (null | string | {[key:string] : {} | string}),async = false, prefix: string=this.prefix,opt:undefined | { opt : { cert : string} }=undefined): Promise<{data : Ack[],error : Ack[]}> {
        path = `${prefix}${path}`;
        // if (async) { console.log(path) }
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
        var obj : {data : Ack[],error : Ack[]} 
            obj = { data: [] , error : []};
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
            .then(()=>{
                // Handle Empty Object
                if (data && Object.keys(data).length === 0) {
                    resolve (obj)
                } else {
                    setTimeout(() => {
                        obj.error.push({ err : Error("TIMEOUT, Failed to put Data"), ok : path});
                        resolve (obj);
                    }, 2000);
                    dataGun.put(<any>data,(ack)=>{
                        if (typeof obj === "undefined") {
                            obj = { data: [] , error : []};
                        }
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
            .catch((err)=>{
                reject(err);
            })
        });
    }

    async purge(path:string) {
        return new Promise(async (resolve,reject)=>{
            let data = await this.Get(path);
            let newData = JSON.parse(JSON.stringify(data));
            if (typeof newData === "object"){
                for (const key in newData) {
                    if (
                        key != "_" &&
                        key != ">" &&
                        key != "#" &&
                        key != ":"  
                    )
                    newData[key] = null;
                }
            }
            this.Put(path,newData)
            .then(()=>{
                resolve("OK")
            })
            .catch(err=>{
                console.log(err);
                reject(JSON.stringify(err));
            })
        })
    }

    /**
     * Delete form user node
     * 
     * 
     * @param path path to delete
     * @param putNull 
     *  - true (if you want to put null value)
     *  - false (if you want to delete the node with it's child)
     * @returns 
     */
    async userDel (path : string, putNull:boolean=true) : Promise<{data : Ack[],error : Ack[]}> {
        return new Promise(async (resolve, reject) => {
            path = `~${this.user.pair.pub}/${path}`
            this.Del(path,putNull)
            .then(res=>{
                resolve(res)
            })
            .catch(err=>{
                reject(err)
            })
        });
    }

    /**
     * Delete node Path. It's not really deleted. It's just detached (tombstone). Data without parent.
     * @param path path to delete
     * @param putNull 
     *  - true (if you want to put null value)
     *  - false (if you want to delete the node with it's child)
     */
    async Del (path : string, putNull:boolean=true,cert:string="") : Promise<{data : Ack[],error : Ack[]}> {
        return new Promise(async (resolve, reject) => {
            // var token = randomAlphaNumeric(50);
            try {

                let randomNode:any;

                let paths = path.split("/");
                let dataGun = this.gun;

                // Check if path is user
                if (putNull) {
                    randomNode = null
                } else {
                    if (paths[0].indexOf("~")>=0) {
                        randomNode = this.gun.user().get('newNode').set({"t" : "_"});
                    } else {
                        randomNode = this.gun.get('newNode').set({"t" : "_"});
                    }    
                }
                
                paths.forEach(path => {
                    dataGun = dataGun.get(path);
                });

                if (cert) {
                    dataGun.put(randomNode,(s)=>{
                        if (s.err === undefined) {
                            resolve({
                                data : [{
                                    "ok" : "ok",
                                    "err" : undefined
                                }],
                                error : []                        
                            })        
                        } else {
                            reject({
                                data : [{
                                    "ok" : "",
                                    "err" : s.err
                                }],
                                error : []                        
                            })        
                        }
                    },{
                        opt : {
                            cert : cert
                        }
                    })                    
                } else {
                    dataGun.put(randomNode,(s)=>{
                        if (s.err === undefined) {
                            resolve({
                                data : [{
                                    "ok" : "ok",
                                    "err" : undefined
                                }],
                                error : []                        
                            })        
                        } else {
                            reject({
                                data : [{
                                    "ok" : "",
                                    "err" : s.err
                                }],
                                error : []                        
                            })        
                        }
                    })                    
                }
            } catch (error) {
                reject(error);
            }
        })        
    }

    /**
     * Load Multi Nested Data
     * @param path 
     * @param repeat time to repeat fetching before returning undefined
     * @param prefix node Prefix
     * @returns 
     */
    async Load (path: string,async=false,repeat: number = 1,prefix: string=this.prefix) : Promise<{data : {[s:string] : any}, err : {path : string, err : string}[]}> {
        return new Promise((resolve, reject) => {
            let promises :Promise<any>[] = []
            let obj : {data : {[s:string] : {}}, err : {path : string, err : string}[]} = { data : {}, err : []};
            this.Get(path,repeat,prefix)
            .then(async (s)=>{
                if (typeof s === "object")
                for (const key in s) {
                    if ( key != "_" && key != "#" && key != ">" ) {
                        var element;
                        if (typeof s === "object") {
                            element = s[key];
                        } else {
                            element = s;
                        }
                        if (typeof element === "object") {
                            if (async) {
                                try {
                                    let s = await <any>this.Load(`${path}/${key}`,async);
                                    obj.data[key] = s;
                                } catch (error) {
                                    (obj.err as any).push(error)
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
                .then(()=>{
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
            .catch(err=>{
                reject(err);
            })
        });
    }

    clearData() {
        var req = indexedDB.deleteDatabase(this.dbname);
        req.onsuccess = function () {
            console.log("Deleted database successfully");
            location.reload();
        };
        req.onerror = function () {
            console.log("Couldn't delete database");
        };
        req.onblocked = function () {
            console.log("Couldn't delete database due to the operation being blocked");
        };
        localStorage.clear();
    }
}
