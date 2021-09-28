//@ts-check

const Gun = require("gun");
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
     * 
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
     * @returns 
     */
    async generatePair () {
        return new Promise(async function (resolve) {
            resolve (await Gun.SEA.pair());
        });        
    }

    /**
     * 
     * @param {{pub : string, epub : string, priv : string, epriv : string}} pair Login with SEA Key Pair
     */
     async loginPair (pair) {
        // @ts-ignore
        this.gun.user().auth(pair,(s=>{
            return new Promise(function (resolve) {
            });
        }));
    }
    
    /**
     * 
     * Create a new user and Log him in
     * 
     * @param {string} username 
     * @param {string} password 
     * @returns 
     */
    async userNew (username = "", password = "") {
        return new Promise((resolve)=>{
            this.gun.user().create(username,password,async (s)=>{
                // @ts-ignore
                //@ts-ignore
                if (s && s.err) {
                    resolve(s);
                } else {
                    this.gun.user().leave();
                    this.user = await this.userLogin(username,password)
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
     * @returns 
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
     * @returns 
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
     * @returns 
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
     * @returns 
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
     * @returns 
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

    /**
     * 
     * Put Data
     * 
     * @param {string} path 
     * @param {(string|object)} data      
     * @param {string} [prefix=""]      
     * @returns 
     */
    async Put (path,data,prefix=this.prefix) {
        path = `${prefix}${path}`;
        let paths = path.split("/");
        let dataGun = this.gun;

        paths.forEach(path => {
            dataGun = dataGun.get(path);
        });

        if (typeof data === "undefined") {
            data = { "t" : "_" }
        }    
    
        return new Promise((resolve)=>{
            dataGun.put(data,(s)=>{
                resolve(s);
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

module.exports = { Firegun }