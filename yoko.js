const {Firegun, Chat} = require('./firegun');

const fg = new Firegun([""],"fireDB",true,undefined,undefined,8766);
const chat = new Chat(fg);

fg.userLogin("yokowasis","123123123")
.then(async s=>{
    // console.log (fg.user.pair)
    // chat.generatePublicCert()
    let pairkey = {
        pub : "Oz-Ik0Q2GSZvBXnveo53ly-2DGSqqBa8-qTvUGZnxmo.-b-aSPENXGTVDl0eumuNFbJj_T1mq4X3uoO77qGCt5A",
        epub : "wsqzIoV8Bk7WbCUAnsfa6KEDIUlPqhqLXcmUZCSfMQw.U9Jf-P8_FWIgvqSRWhrPVrRIcFybHxTsDnCg3a5Ru1k"
    }
    let chats = await chat.retrieve(pairkey,["2021","9","29"]);
    console.log (chats);
})
