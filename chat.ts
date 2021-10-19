import Gun from 'gun'
import Firegun from "./firegun";
import { Pubkey, FiregunUser, Ack } from './types'

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
