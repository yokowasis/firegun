const Gun = require("gun");
const Crypto = require('crypto');
 
require('gun/sea');
require('gun/lib/load');
require('gun/lib/radix');
require('gun/lib/radisk');
require('gun/lib/store');
require('gun/lib/rindexed');


class Firegun {
    /**
     * 
     * --------------------------------------
     * Create Firegun Instance
     * 
     * @param {string[]} peers - Peers url
     * @param {string} [dbname="fireDB"] - Database Name
     * @param {boolean} [localstorage = false] Method of saving the database. 
     * - localStorage : true 
     * - indexedDB : false
     * @param {string} [prefix=""] Database Prefix
     * @param {boolean} [axe=false] Do You want to use Axe Support ?
     * @param {number} [port=8765] Multicast Port
     */

    constructor(peers = [""],dbname="fireDB", localstorage=false,prefix="",axe=false,port=8765) {

        this.prefix = prefix;

        this.gun = Gun({
            file : dbname,
            localStorage : localstorage,
            axe : axe,
            multicast : {
                port : port
            },
            peers : peers
        })

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

    async _timeout (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    
    /**
     * ----------------------------------
     * Insert CONTENT-ADDRESSING Readonly Data.
     * 
     * dev note : Sebenarnya bisa tambah lagi searchable path dengan RAD, 
     * hanya saja RAD masih Memiliki BUG, dan tidak bekerja secara consistent
     * @param {string} key must begin with #
     * @param {(string | {})} data If object, it will be stringified automatically
     * @returns {Promise<({err:Error,ok:any}|{err:undefined,ok:string})>}
     */
     async addContentAdressing (key,data) {
        if (typeof data === "object") {
            data = JSON.stringify(data);
        }
        let hash = await Gun.SEA.work(data, null, null, {name: "SHA-256"});
        return new Promise((resolve) => {
            // @ts-ignore
            this.gun.get(`${key}`).get(hash).put(data,(s)=>{
                resolve(s);
            });
        });        
    }
    
    /**
     * Generate Key PAIR from SEA module
     * @returns {Promise<{pub:string,priv:string,epub:string,epriv:string}>}
     */
    async generatePair () {
        return new Promise(async function (resolve) {
            resolve (await Gun.SEA.pair());
        });        
    }

    /**
     * 
     * @param {{pub : string, epub : string, priv : string, epriv : string}} pair Login with SEA Key Pair
     * @returns {Promise<({err:Error}|{alias:string,pair:{priv:string,pub:string,epriv:string,epub:string}})>}
     */
     async loginPair (pair) {

        return new Promise((resolve)=>{
            // @ts-ignore
            this.gun.user().auth(pair,(s=>{
                // @ts-ignore
                if (s.err) {
                    // @ts-ignore
                    resolve (s.err)
                } else {
                    this.user = {
                        //@ts-ignore
                        alias : s.put.alias,
                        //@ts-ignore
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
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<{err : string}|{alias: string,pair: {priv: string,pub: string,epriv: string,epub: string}}>}
     */
    async userNew (username = "", password = "") {
        return new Promise((resolve)=>{
            this.gun.user().create(username,password,async (s)=>{
                //@ts-ignore
                if (s && s.err) {
                    // @ts-ignore
                    resolve(s);
                } else {
                    this.gun.user().leave();
                    this.user = await this.userLogin(username,password);
                    resolve(this.user);    
                }
            });
        })        
    }

    /**
     * 
     * Log a user in
     * 
     * @param {string} username 
     * @param {string} password 
     * @param {number} repeat time to repeat the login before give up. Because the nature of decentralization, just because the first time login is failed, doesn't mean the user / password pair doesn't exist in the network
     * @returns {Promise.<{alias: string,pair: {priv: string,pub: string,epriv: string,epub: string}}>}
     */
    async userLogin (username, password, repeat=2) {
        return new Promise((resolve)=>{
            this.gun.user().auth(username,password,async (s)=>{
                //@ts-ignore
                if (s && s.err) {
                    if (repeat>0) {
                        await this._timeout(1000);
                        resolve (await this.userLogin(username,password,repeat-1));
                    } else {
                        //@ts-ignore
                        resolve(s);
                    }                    
                } else {
                    this.user = {
                        alias : username,
                        //@ts-ignore
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
        this.user = undefined;
    }

    /**
     * 
     * Fetch data from userspace
     * 
     * @param {string} path 
     * @param {number} [repeat=1] time to repeat fetching before returning undefined
     * @param {string} [prefix=""] Database Prefix
     * @returns {Promise<{}>}
     */
    async userGet (path,repeat = 1,prefix=this.prefix) {
        // @ts-ignore
        if (this.gun.user().is) {
           path = `~${this.user.pair.pub}/${path}`
           return (await this.Get(path,repeat,prefix));
        } else {
            return undefined;
        }
    }

    /**
     * Load Multi Nested Data From Userspace
     * @param {string} path 
     * @param {number} [repeat=1] time to repeat fetching before returning undefined
     * @param {string} [prefix=""] Database Prefix
     * @returns {Promise<{}>}
     */
    async userLoad (path,repeat = 1,prefix=this.prefix) {
        // @ts-ignore
        if (this.gun.user().is) {
           path = `~${this.user.pair.pub}/${path}`
           return (await this.Load(path,repeat,prefix));
        } else {
            return undefined;
        }
    }

    /**
     * 
     * Fetching data
     * 
     * @param {string} path 
     * @param {number} [repeat=1] time to repeat fetching before returning undefined
     * @param {string} [prefix=""] Database Prefix
     * @returns {Promise<{}>}
     */
    async Get (path,repeat = 1,prefix=this.prefix) {
        let path0 = path;
        path = `${prefix}${path}`;
        let paths = path.split("/");
        let dataGun = this.gun;
        
        paths.forEach(path => {
            dataGun = dataGun.get(path);
        });
        
        return new Promise((resolve) => {
            dataGun.once(async (s)=>{
                if (s) {
                    s = JSON.parse(JSON.stringify(s));
                    resolve(s);
                } else {
                    if (repeat) {
                        await (this._timeout(1000))
                        resolve (await this.Get(path0,repeat-1,prefix));
                    } else {
                        resolve (s);
                    }
                }                
            })            
        });
    }

    /**
     * 
     * Put data on userspace
     * 
     * @param {string} path 
     * @param {(string | object)} data 
     * @returns {Promise<({"@":string,err:undefined,ok:{"" : number},"#":string}|{ err: Error; ok: any; })>}
     */
    async userPut (path,data,prefix=this.prefix) {
        // @ts-ignore
        if (this.gun.user().is) {
            path = `~${this.user.pair.pub}/${path}`
            return (await this.Put(path,data,prefix));
         } else {
             return undefined;
         } 
    }

    async newPut (path,data = {},prefix=this.prefix) {
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                const element = data[key];
                if (typeof element === "object") {
                    this.newPut(`${path}/${key}`,element)
                } else {
                    this.newPut(`${path}/${key}`,element)
                }
            }
        }
    }

    async Set (path,data,prefix=this.prefix,opt={}) {
        return new Promise(async (resolve, reject) => {
            Crypto.randomBytes(30,(err, buffer) => {
                var token = buffer.toString('hex');
                this.Put(`${path}/${token}`,data,prefix,opt)
                .then(s=>{
                    if (s.err) {
                        reject(s);                        
                    } else {
                        resolve(s);
                    }
                })
            });        
        });
    }

    /**
     * ----------------------------
     * Put Data to the gunDB Node
     * 
     * @param {string} path 
     * @param {(string|object)} data      
     * @param {string} [prefix=""]      
     * @param {{}} [opt={}]
     * @returns {Promise<({"@":string,err:undefined,ok:{"" : number},"#":string}|{ err: Error; ok: any; })>} Promise
     */
    async Put (path,data,prefix=this.prefix,opt={}) {
        path = `${prefix}${path}`;
        let paths = path.split("/");
        let dataGun = this.gun;

        paths.forEach(path => {
            dataGun = dataGun.get(path);
        });

        if (typeof data === "undefined") {
            data = { "t" : "_" }
        }
        let promises = [];
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                const element = data[key];
                if (typeof element === "object") {
                    delete data[key];
                    promises.push(this.Put(`${path}/${key}`,element))
                }
            }
        }
        
        return new Promise((resolve)=>{
            Promise.allSettled(promises)
            .then(s=>{
                // console.log(s);
                dataGun.put(data,(ack)=>{
                    resolve(ack);
                },opt)    
            })
        });
    }

    /**
     * Load Multi Nested Data
     * @param {string} path 
     * @param {number} [repeat=1] time to repeat fetching before returning undefined
     * @param {string} [prefix=""] Database Prefix
     * @returns 
     */
    async Load (path,repeat = 1,prefix=this.prefix) {
        return new Promise((resolve, reject) => {
            let promises = [];
            let obj = {};
            this.Get(path,repeat,prefix)
            .then(s=>{
                for (const key in s) {
                    if ( key != "_" && key != "#" && key != ">" ) {
                        const element = s[key];
                        if (typeof element === "object") {       
                            promises.push(this.Load(`${path}/${key}`).then(s=>{
                                obj[key] = s;
                            }));
                        } else {
                            obj[key] = element;
                        }
                    }
                }
                Promise.allSettled(promises)
                .then(s=>{
                    resolve(obj);
                })
            })
        });
    }
}

class Chat {

    /**
     * 
     * @param {Firegun} firegun Firegun instance
     */
    constructor(firegun) {
        this.firegun = firegun;
        this.user = this.firegun.user;        
    }

    async generatePublicCert() {        
        let cert = await Gun.SEA.certify("*", [{ "*" : "chat-with","+" : "*"}], this.firegun.user.pair,null,{
            // blacklist : 'chat-blacklist' //ADA BUG DARI GUN JADI BELUM BISA BLACKLIST
        });
        console.log (cert);
        this.firegun.userPut("chat-cert",cert);
    }

    /**
     * 
     * @param {{pub : string, epub? : string}} pubkey 
     * @param {*} date 
     */
    async retrieve(pubkey, date=[]) {
        let data = await this.firegun.userLoad(`chat-with/${pubkey.pub}/${date.join("/")}`);
        if (pubkey.epub) {
            for (const key in data) {
                if (Object.hasOwnProperty.call(data, key)) {
                    data[key].msg = await Gun.SEA.decrypt(data[key].msg, await Gun.SEA.secret(pubkey.epub, this.firegun.user.pair));
                }
            }    
        }
        return data;
    }

    /**
     * 
     * Send Message
     * 
     * @param {{pub : string, epub?: string}} pairkey 
     * @param {string} msg 
     * @returns 
     */
    async send(pairkey,msg) {
        return new Promise(async (resolve, reject) => {
            if (pairkey.epub) {
                msg = await Gun.SEA.encrypt(msg,await Gun.SEA.secret(pairkey.epub,this.firegun.user.pair));
            }
            let cert = await this.firegun.Get(`~${pairkey.pub}/chat-cert`);
            let currentdate = new Date(); 
            let datetime =  currentdate.getDate() + "/"
                            + (currentdate.getMonth()+1)  + "/" 
                            + currentdate.getFullYear() + " @ "  
                            + currentdate.getHours() + ":"  
                            + currentdate.getMinutes() + ":" 
                            + currentdate.getSeconds();
           
            
            // userspace/chat-with/publickey/year/month/day * 2, Pengirim dan Penerima
            console.log (msg);
            this.firegun.Set(`~${pairkey.pub}/chat-with/${this.firegun.user.pair.pub}/${currentdate.getFullYear()}/${(currentdate.getMonth()+1)}/${currentdate.getDate()}`,{
                "timestamp" : datetime, 
                "msg" : msg, 
                status : "sent"
            },undefined,{
                opt : {
                    cert : cert
                }
            })
            .then(s=>{
                if (s.err) {
                    reject(s);
                } else {
                    resolve(s);
                }
            })
        });
    }

}

module.exports = { Firegun, Chat }