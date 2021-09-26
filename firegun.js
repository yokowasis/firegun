const Gun = require("gun");
require('gun/sea');
require('gun/lib/load');
require('gun/lib/radix');
require('gun/lib/radisk');
require('gun/lib/store');
require('gun/lib/rindexed');

class Firegun {
    constructor(peers = [],dbname="fireDB", localstorage=false,prefix="",axe=false,port=8765) {

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
     * Insert CONTENT-ADDRESSING Readonly Data.
     * Sebenarnya bisa tambah lagi searchable path dengan RAD, 
     * hanya saja RAD masih Memiliki BUG, dan tidak bekerja secara consistent
     * @param {string} key must begin with #
     * @param {string} data string or object. If object, it will be stringified automatically
     * 
     */
     async addContentAdressing (key="#",data = "") {
        if (typeof data === "object") {
            data = JSON.stringify(data);
        }
        let hash = await Gun.SEA.work(data, null, null, {name: "SHA-256"});
        return new Promise((resolve) => {
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

     async loginPair (pair) {
        this.gun.user().auth(pair,(s=>{
            return new Promise(function (resolve) {
            });
        }));
    }
    
    async userNew (username, password) {
        return new Promise((resolve)=>{
            this.gun.user().create(username,password,async (s)=>{
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

    async userLogin (username, password, repeat=2) {
        return new Promise((resolve)=>{
            this.gun.user().auth(username,password,async (s)=>{
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
                        pair : s.sea,
                    }
                    resolve(this.user);    
                }
            })
        });
    }

    async userLogout () {
        this.gun.user().leave();
        this.user = {};
    }

    async userGet (path,repeat = 1,prefix=this.prefix) {
        if (this.gun.user().is) {
           path = `~${this.user.pair.pub}/${path}`
           return (await this.Get(path,repeat,prefix));
        } else {
            return undefined;
        }
    }

    async Get (path,repeat = 1,prefix=this.prefix) {
        let path0 = path;
        let paths = path;
        let dataGun = this.gun;
        path = `${prefix}${path}`;
        paths = paths.split("/");
        
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

    async userPut (path,data,prefix=this.prefix) {
        if (this.gun.user().is) {
            path = `~${this.user.pair.pub}/${path}`
            return (await this.Put(path,data,prefix));
         } else {
             return undefined;
         } 
    }

    async Put (path,data,prefix=this.prefix) {
        path = `${prefix}${path}`;
        let paths = path
        let dataGun = this.gun;
        paths = paths.split("/");

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
}

module.exports = { Firegun }