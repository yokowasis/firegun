import { Ack, common, FiregunUser, Pubkey } from './common';
import Firegun from "./firegun";

export default class Chat {

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

    async getCert(pubKey:string) {
        try {
            let cert = await this.firegun.Get(`~${pubKey}/chat-cert`);
            return cert;
        } catch (error) {
            console.log (error);
            return "";
        }
    }

    /**
     * Generate Public Certificate for Logged in User
     * @returns 
     */
    async generatePublicCert() : Promise<{data : Ack[],error : Ack[]}> {
        return await common.generatePublicCert(this.firegun);
    }

    /**
     * --------------------
     * Retrieving chats
     * @param pubkey 
     * @param date 
     * @returns
     */
    async retrieve(pubkey: Pubkey, date : string[] = []) {
        return new Promise(async (resolve, reject) => {
            if (!this.firegun.user.alias) {
                reject("User Belum Login")
            } else {
                console.log ("RETRIEVING ...");
                let data : {[key:string] : any} | undefined = await this.firegun.userLoad(`chat-with/${pubkey.pub}/${date.join("/")}`);
                let sortedData : {}[] = [];
                console.log ("DONE !!");
                for (const key in data) {
                    if (Object.hasOwnProperty.call(data, key)) {
                        if (pubkey.epub) {
                            if (data[key]._self) {
                                data[key].msg = await this.firegun.Gun.SEA.decrypt(data[key].msg, this.firegun.user.pair);
                            } else {
                                data[key].msg = await this.firegun.Gun.SEA.decrypt(data[key].msg, await (this.firegun.Gun as any).SEA.secret(pubkey.epub, this.firegun.user.pair));
                            }
                        }
                    }
                    sortedData.push(data[key]);
                }
                sortedData.sort(common.dynamicSort("timestamp"));
                resolve(sortedData);
            }            
        });

    }

    async unsend(pairkey: Pubkey,date:string,chatID: string,cert=""): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (!this.firegun.user.alias) {
                reject("User Belum Login")
            } else {
                if (cert === "") {
                    let tempCert = await this.firegun.Get(`~${pairkey.pub}/chat-cert`);
                    if (typeof tempCert === "string") {
                        cert = tempCert;
                    }
                }
                
                try {
                    await this.firegun.Del(`~${pairkey.pub}/chat-with/${this.firegun.user.pair.pub}/${date}/${chatID}`,true,cert)
                    await this.firegun.userDel(`chat-with/${pairkey.pub}/${date}/${chatID}`)
                    await this.firegun.Put(`~${pairkey.pub}/chat-with/${this.firegun.user.pair.pub}/${date}/unsendChat`,chatID,true,"",{opt : { cert : cert }})
                    resolve("OK");                    
                } catch (error) {
                    reject (error);                
                }
            }
        });        
    }

    /**
     * 
     * Send Chat Message
     * 
     * @param pairkey 
     * @param msg 
     * @returns
     */
    async send(pairkey: Pubkey,msg: string,cert=""): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (!this.firegun.user.alias) {
                reject("User Belum Login")
            } else {
                let msgToHim, msgToMe;
                if (pairkey.epub) {
                    msgToHim = await this.firegun.Gun.SEA.encrypt(msg,await (this.firegun.Gun as any).SEA.secret(pairkey.epub,this.firegun.user.pair));
                    msgToMe = await this.firegun.Gun.SEA.encrypt(msg,this.firegun.user.pair);
                } else {
                    msgToHim = msg
                }
                msgToMe = msgToMe || ""
                
                if (cert === "") {
                    let tempCert = await this.firegun.Get(`~${pairkey.pub}/chat-cert`);
                    if (typeof tempCert === "string") {
                        cert = tempCert;
                    }
                }
                let datetime = common.getDate()    
                let timestamp = `${datetime.year}/${datetime.month}/${datetime.date}T${datetime.hour}:${datetime.minutes}:${datetime.seconds}.${datetime.miliseconds}`;               
                let promises = [];
    
                // Harus await, entah kenapa. Kalau tidak await tidak bisa.
    
                // Put to Penerima userspace/chat-with/publickey/year/month/day * 2, Pengirim dan Penerima
                promises.push(
                    await this.firegun.Put(`~${pairkey.pub}/chat-with/${this.firegun.user.pair.pub}/${datetime.year}/${datetime.month}/${datetime.date}/${timestamp.replace(/\//g, '.')}`,{
                        "id" : timestamp.replace(/\//g, '.'),
                        "_self" : false,
                        "timestamp" : timestamp, 
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
                    await this.firegun.Put(`~${this.firegun.user.pair.pub}/chat-with/${`${pairkey.pub}`}/${datetime.year}/${datetime.month}/${datetime.date}/${timestamp.replace(/\//g, '.')}`,{
                        "id" : timestamp.replace(/\//g, '.'),
                        "_self" : true,
                        "timestamp" : timestamp, 
                        "msg" : msgToMe, 
                        "status" : "sent"
                    })
                )
                
                Promise.all(promises)
                .then(()=>{
                    resolve("OK");
                })
                .catch(err=>{
                    reject(err);
                })                
            }
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
    async groupSend(groupowner: string,groupname: string,msg: string) : Promise<{data : Ack[],error : Ack[]}> {
        console.log(groupowner);
        return new Promise(async (resolve, reject) => {
            let datetime = common.getDate()    
            let timestamp = `${datetime.year}/${datetime.month}/${datetime.date}T${datetime.hour}:${datetime.minutes}:${datetime.seconds}.${datetime.miliseconds}`;               
            
            await this.firegun.userPut(`chat-group-with/${groupowner}&${groupname}/${datetime.year}/${datetime.month}/${datetime.date}/${timestamp.replace(/\//g, '.')}`,{
                "id" : timestamp.replace(/\//g, '.'),
                "_self" : true,
                "timestamp" : timestamp, 
                "msg" : msg, 
                status : "sent"
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
     async groupNew(groupname: string, groupDesc:string, groupImage:string) : Promise<string> {
        // /userspace/chat-group/groupname/cert
        if (this.firegun.user.alias) {
            return new Promise(async (resolve, reject) => {
                let promises:any[] = [];
                promises.push(this.firegun.userPut(`chat-group/${groupname}/info/name`,groupname))
                promises.push(this.firegun.userPut(`chat-group/${groupname}/info/desc`,groupDesc))
                promises.push(this.firegun.userPut(`chat-group/${groupname}/info/image`,groupImage))
                promises.push(this.firegun.userPut(`chat-group/${groupname}/members`,JSON.stringify([{
                    "alias" : this.firegun.user.alias,
                    "pub" : this.firegun.user.pair.pub
                }])));
                promises.push(this.firegun.userPut(`chat-group-with/${this.firegun.user.pair.pub}&${groupname}`,{"t" : "_"}));
                Promise.allSettled(promises)
                .then(()=>{
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

        return new Promise(async (resolve, reject) => {
            // BUG Blacklis Work Around
            // await this.firegun.userPut(`chat-group/${groupname}/banlist`,{
            //     "t" : "_"
            // })
            let members:string[];
            let s = await this.firegun.userGet(`chat-group/${groupname}/members`);
            if (typeof s === "string") {
                members = JSON.parse(s);
                let cert = await (this.firegun.Gun as any).SEA.certify(members, [{ "*" : `chat-group/${groupname}/chat`,"+" : "*"}], this.firegun.user.pair,null,{
                    // block : `chat-group/${groupname}/banlist` //ADA BUG DARI GUN JADI BELUM BISA BLACKLIST
                });    
                this.firegun.userPut(`chat-group/${groupname}/cert`,cert)
                .then(s=>{
                    resolve(s);
                })
                .catch(err=>{
                    reject(err);    
                })        
            } else {
                reject("Members node not found");
            }
        });
    }

    /**
     * -----------------------------
     * Invite new member to group
     * 
     * @param groupname
     * @param pairkey 
     */
    async groupInvite(groupname: string, pubkey: string, alias : string) {
        let data = await this.firegun.userGet(`chat-group/${groupname}/members`);
        if (typeof data === "string") {
            let members = JSON.parse(data);
            members.push({
                "alias" : alias,
                "pub" : pubkey,
            })            
            let res = await this.firegun.userPut(`chat-group/${groupname}/members`,JSON.stringify(members));
            return (res);
        } else {
            return {}
        }
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
