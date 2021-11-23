import { Ack, chatType, common, FiregunUser, Pubkey } from './common';
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

    async decryptChat (s:{[x:string] : any},pubkey : Pubkey) {
        if (s.msg) {
            if ((typeof s.msg === "string") && (s.msg.search("SEA") === 0))
            if (s._self) {
                s.msg = await this.firegun.Gun.SEA.decrypt(s.msg, this.firegun.user.pair);
            } else {
                s.msg = await this.firegun.Gun.SEA.decrypt(s.msg, await (this.firegun.Gun as any).SEA.secret(pubkey.epub, this.firegun.user.pair));
            }
            return (s);
        } else {
            return ({})
        }
    }

    /**
     * Retrieve Chat Message, the result is stream
     * 
     * @param pubkey 
     * @param date 
     * @param month 
     * @param year 
     * @param callback 
     */
    async retrieveDaily(pubkey: Pubkey, date : {date:string, month:string, year:string}) {
        let res = await this.firegun.userLoad(`chat-with/${pubkey.pub}/${date.year}/${date.month}/${date.date}`);

        // Load Data for 1 day
        let chats:chatType[] = [];
        if (res) {
            for (const id in res.data) {
                if (Object.prototype.hasOwnProperty.call(res.data, id)) {
                    let s = res.data[id].data;
                    if (s && s.id) {
                        s = await this.decryptChat(s,pubkey);
                        if (s)
                            chats.push(s);
                    }
                }
            }
        }

        return chats;
    }

    async retrieveMonthly(pubkey: Pubkey, date : {month:string, year:string}) {
        let res = await this.firegun.userLoad(`chat-with/${pubkey.pub}/${date.year}/${date.month}`);

        // Load chat for 1 month
        let chats:chatType[] = [];
        if (res)
        for (const date in res.data) {
            const chatInDate = res.data[date].data;
            for (const id in chatInDate) {
                if (Object.prototype.hasOwnProperty.call(chatInDate, id)) {
                    let s = chatInDate[id].data;
                    if (s && s.id) {
                        s = await this.decryptChat(s,pubkey);
                        if (s)
                            chats.push(s);
                    }
                }
            }
        }

        return chats;
    }

    async listen(pubkey : Pubkey, callback:(s:{[x:string] : any})=>void) {
        let date = common.getDate();
        this.firegun.gun.user().get("chat-with").get(pubkey.pub).get(date.year).get(date.month).get(date.date).map((s)=>{
            if (s && s.id) {
                // only listen to future chat
                if (s.id > `${date.year}.${date.month}.${date.date}T${date.hour}:${date.minutes}:${date.seconds}.${date.miliseconds}`) {
                    return (s)                                                                                                
                } else {
                    return null
                }
            } else {
                return null
            }
        }).once(async (s)=>{
            if (s && s.id) {
                s = await this.decryptChat(s,pubkey);
                if (s)
                    callback(s);
            }
        })
    }
    
    async listenUnsent(pubkey : Pubkey, callback:(chatID:string)=>void) {
        const dateNow = common.getDate();
        const date = `${dateNow.year}/${dateNow.month}/${dateNow.date}`;
        this.firegun.On(`~${this.firegun.user.pair.pub}/chat-with/${pubkey.pub}/${date}/unsendChat`,(res)=>{
            if (typeof res === "string") {
                callback(res);
            }
        },pubkey.pub.substring(0,8),true);
    }
    
    async groupRetrieveChat(groupkey: { owner:string, alias:string}, date : {date:string, month:string, year:string} ,callback:(s:{[x:string] : any},alwaysSelf? : boolean)=>void) {
        this.groupGetMembers(groupkey.owner,groupkey.alias)
        .then(members => {
            members.forEach(async (member) => {
                this.firegun.gun.get(`~${member.pub}`).get("chat-group-with").get(`${groupkey.owner}&${groupkey.alias}`).get(date.year).get(date.month).get(date.date).map().once(async (s)=>{
                    if (s) {
                        callback(s);
                        callback(s,member.pub === this.firegun.user.pair.pub);
                    }                        
                })            
            })    
        })
    }

    async groupRetrieveChatMonthly(groupkey: { owner:string, alias:string}, date : {date:string, month:string, year:string} ,callback:(s:{[x:string] : any},alwaysSelf? : boolean)=>void) {

        let dateNow = common.getDate()

        this.groupGetMembers(groupkey.owner,groupkey.alias)
        .then(members => {
            members.forEach(async (member) => {

                let data = await this.firegun.Load(`~${member.pub}/chat-group-with/${groupkey.owner}&${groupkey.alias}/${date.year}/${date.month}`);
                if (data)
                for (const date in data.data) {
                    const chatInDate = data.data[date].data;
                    for (const id in chatInDate) {
                        if (Object.prototype.hasOwnProperty.call(chatInDate, id)) {
                            let s = chatInDate[id].data;
                            console.log (s);
                            if (s && s.id) {
                                if (s) {
                                    callback(s,member.pub === this.firegun.user.pair.pub);
                                }
                            }
                        }
                    }
                }
        
        

                this.firegun.gun.get(`~${member.pub}`).get("chat-group-with").get(`${groupkey.owner}&${groupkey.alias}`).get(date.year).get(date.month).get(date.date).map((s)=>{
                    if (s && s.id) {
                        if (s.id > `${dateNow.year}.${dateNow.month}.${dateNow.date}T${dateNow.hour}:${dateNow.minutes}:${dateNow.seconds}.${dateNow.miliseconds}`) {
                            return (s)                                                                                                
                        } else {
                            return null
                        }
                    } else {
                        return null
                    }        
                }).once(async (s)=>{
                    if (s) {
                        callback(s,member.pub === this.firegun.user.pair.pub);
                    }                        
                })            
            })    
        })
    }

    async searchChat (searchString:string, pub:string, epub:string, callback:(s:{[x:string] : string})=>void) {
        let date = common.getDate();
        this.firegun.gun.user().get("chat-with")
            .get(pub)
            .get(date.year)
            .once().map()
            .once().map()
            .once().map()
            .once(async (s)=>{
                if (s !== undefined) {
                    if ((typeof s.msg === "string") && (s.msg.search("SEA") === 0))
                    if (s._self) {
                        s.msg = await this.firegun.Gun.SEA.decrypt(s.msg, this.firegun.user.pair);
                    } else {
                        s.msg = await this.firegun.Gun.SEA.decrypt(s.msg, await (this.firegun.Gun as any).SEA.secret(epub, this.firegun.user.pair));
                    }                        
                    if (s.msg !== undefined && s.msg.toLowerCase().indexOf(searchString.toLowerCase()) !== -1) {
                        callback(s);
                    }    
                }
            })
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

    deleteChat = (pubkey:string, chatID:string, timestamp:string) => {
        const date = timestamp.split("T")[0];
        this.firegun.userDel(`chat-with/${pubkey}/${date}/${chatID}`)
        console.log ("DELETE", `chat-with/${pubkey}/${date}/${chatID}`);
    }

    groupDeleteChat = (groupID:string, chatID:string, timestamp:string) => {
        const date = timestamp.split("T")[0];
        this.firegun.userDel(`chat-group-with/${groupID}/${date}/${chatID}`)
        console.log ("DELETE", `chat-with/${groupID}/${date}/${chatID}`);        
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
                        "alias" : this.firegun.user.alias,
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
                        "alias" : this.firegun.user.alias,
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
        return new Promise(async (resolve, reject) => {
            let datetime = common.getDate()    
            let timestamp = `${datetime.year}/${datetime.month}/${datetime.date}T${datetime.hour}:${datetime.minutes}:${datetime.seconds}.${datetime.miliseconds}`;               
            
            await this.firegun.userPut(`chat-group-with/${groupowner}&${groupname}/${datetime.year}/${datetime.month}/${datetime.date}/${timestamp.replace(/\//g, '.')}`,{
                "alias" : this.firegun.user.alias,
                "id" : timestamp.replace(/\//g, '.'),
                "_self" : true,
                "timestamp" : timestamp, 
                "msg" : msg, 
                "status" : "sent"
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
    async groupInvite(groupowner:string, groupname: string, pubkey: string, alias : string) {

        // Verifikasi apakah user yang mengakses adalah pemilik group atau masuk ke dalam list admin
        let currentUser = this.firegun.user.pair.pub;

        let valid = false;
        if (currentUser === groupowner) {
            // user yg login adalah pemilik group
            valid = true
        } else {
            // bukan pemilik, cek apakah termasuk ke dalam admin
            let admins = await this.groupGetAdmin(groupowner,groupname);
            if (admins.some(e => e.pub === currentUser)) {
                valid = true
            }
        }

        if (this.firegun.user.alias && valid) {
            let members = await this.groupGetMembers(groupowner,groupname);
            members.push({
                "alias" : alias,
                "pub" : pubkey,
            })            
    
            let res;
            if (currentUser === groupowner) {
                res = await this.firegun.userPut(`chat-group/${groupname}/members`,JSON.stringify(members));
            } else {
                let cert:string;
                try {
                    cert = await this.firegun.Get(`~${groupowner}/chat-group/${groupname}/adminCert`) as string;
                    res = await this.firegun.Put(`~${groupowner}/chat-group/${groupname}/members`,JSON.stringify(members),false,"",{opt : { cert : cert}});
                } catch (error) {
                    res = {}
                }                        
            }
            return (res);
        } else {
            return "User have no right"
        }
    }

    /**
     * -------------------------
     * Set group Info
     * 
     * @param groupname 
     * @param info 
     */
    async groupSetInfo(groupowner:string, groupname: string, groupDesc:string, groupImage:string) : Promise<string> {

        // Verifikasi apakah user yang mengakses adalah pemilik group atau masuk ke dalam list admin
        let currentUser = this.firegun.user.pair.pub;

        let valid = false;
        if (currentUser === groupowner) {
            // user yg login adalah pemilik group
            valid = true
        } else {
            // bukan pemilik, cek apakah termasuk ke dalam admin
            let admins = await this.groupGetAdmin(groupowner,groupname);
            if (admins.some(e => e.pub === currentUser)) {
                valid = true
            }
        }

        if (this.firegun.user.alias && valid) {
            return new Promise(async (resolve, reject) => {
                let promises:any[] = [];
                if (currentUser === groupowner) {
                    promises.push(this.firegun.Put(`~${groupowner}/chat-group/${groupname}/info/name`,groupname))
                    promises.push(this.firegun.Put(`~${groupowner}/chat-group/${groupname}/info/desc`,groupDesc))
                    promises.push(this.firegun.Put(`~${groupowner}/chat-group/${groupname}/info/image`,groupImage))
                } else {
                    let cert:string;
                    try {
                        cert = await this.firegun.Get(`~${groupowner}/chat-group/${groupname}/adminCert`) as string;
                    } catch (error) {
                        cert = ""
                    }

                    if (cert) {
                        promises.push(this.firegun.Put(`~${groupowner}/chat-group/${groupname}/info/name`,groupname,false,"",{ opt : { cert : cert} }))
                        promises.push(this.firegun.Put(`~${groupowner}/chat-group/${groupname}/info/desc`,groupDesc,false,"",{ opt : { cert : cert} }))
                        promises.push(this.firegun.Put(`~${groupowner}/chat-group/${groupname}/info/image`,groupImage,false,"",{ opt : { cert : cert} }))
                    }
                }
                promises.push(this.firegun.userPut(`~${groupowner}/chat-group-with/${this.firegun.user.pair.pub}&${groupname}`,{"t" : "_"}));
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
     * Group Get Info
     * 
     * @param groupname 
     * @returns 
     */
    async groupGetInfo(groupowner:string, groupname : string) {
        let data: {
            desc : string,
            name : string,
            image : string,
        };
        try {
            data = (await this.firegun.Get(`~${groupowner}/chat-group/${groupname}/info`) as any);
        } catch (error) {
            data = {
                desc : "",
                name : "",
                image : "",
            }
        }
        return (data)        
    }

    async groupBan(groupname:string, pubkey:string) {
        let data = await this.firegun.userGet(`chat-group/${groupname}/members`);
        if (typeof data === "string") {
            let members:{alias:string,pub:string}[] = JSON.parse(data);

            members = members.filter(s=>s.pub !== pubkey);
            
            let res = await this.firegun.userPut(`chat-group/${groupname}/members`,JSON.stringify(members));
            return (res);
        } else {
            return {}
        }
    }

    async groupGetAdmin(groupOwner:string, groupName:string) : Promise<{alias:string, pub:string}[]> {
        var data;
        try {
            let s = await this.firegun.Get(`~${groupOwner}/chat-group/${groupName}/admins`);
            if (typeof s === "string") {
                data = s
            } else {
                data = JSON.stringify([]);
            }
        } catch (error) {
            data = JSON.stringify([]);            
        }
        if (typeof data === "string") {
            let members = JSON.parse(data);
            return members
        } else {
            return []
        }
    }

    async groupGetMembers(groupOwner:string, groupName:string) : Promise<{alias:string, pub:string}[]> {
        var data;
        try {
            
            let s = await this.firegun.Get(`~${groupOwner}/chat-group/${groupName}/members`);
            if (typeof s === "string") {
                data = s
            } else {
                data = JSON.stringify([]);
            }
            
        } catch (error) {
            data = JSON.stringify([]);            
        }
        if (typeof data === "string") {
            let members = JSON.parse(data);
            return members
        } else {
            return []
        }
    }

    async groupInviteAdmin(groupname: string, pubkey: string, alias : string) {
        var data:string;
        try {
            let s = await this.firegun.userGet(`chat-group/${groupname}/admins`); 
            if (typeof s === "string") {
                data = s;
            } else {
                data = JSON.stringify([]);                
            }
        } catch (error) {
            data = JSON.stringify([]);
        }
        let members = JSON.parse(data);
        members.push({
            "alias" : alias,
            "pub" : pubkey,
        })            

        // Cek lagi untuk add multi user pubkey, instead of *. Terakhir kali coba gagal.
        let cert = await (this.firegun.Gun as any)
                    .SEA.certify("*", [
                        { "*" : `chat-group`}
                    ], this.firegun.user.pair,null,{
            // block : `chat-group/${groupname}/banlist` //ADA BUG DARI GUN JADI BELUM BISA BLACKLIST
        });

        let res = await this.firegun.userPut(`chat-group/${groupname}/admins`,JSON.stringify(members));
        await this.firegun.userPut(`chat-group/${groupname}/adminCert`,cert);

        return (res);
    }

    async groupBanAdmin(groupname:string, pubkey:string) {
        let data = await this.firegun.userGet(`chat-group/${groupname}/admins`);
        if (typeof data === "string") {
            let members:{alias:string,pub:string}[] = JSON.parse(data);

            members = members.filter(s=>s.pub !== pubkey);
            
            let res = await this.firegun.userPut(`chat-group/${groupname}/admins`,JSON.stringify(members));
            return (res);
        } else {
            return {}
        }
    }

}
