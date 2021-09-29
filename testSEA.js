const Gun = require("gun");
require('gun/sea');

const gun = Gun();

(async()=>{
    const user1Pair = await Gun.SEA.pair();
    const user2Pair = await Gun.SEA.pair();
    
    const cert = await Gun.SEA.certify("*",{"*" : "chat-with"},user1Pair,null,{
        // blacklist : 'blacklist' //ADA BUG DARI GUN JADI BELUM BISA BLACKLIST
    });

    gun.user().auth(user2Pair,cb=>{
        gun.get(`~${user1Pair.pub}`).get("chat-with").put({
            "hello" : "world"
        },ack=>{
            console.log (ack);
        },{
            opt : {
                cert : cert
            }
        })    
    })
})()