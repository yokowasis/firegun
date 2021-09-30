const {Firegun, Chat} = require("./firegun")

const fg = new Firegun();
const chat = new Chat(fg);



(async (s)=>{
    const pairkey = {
        pub : "EX-Tsw_muNVHSW4txyehsls9j1RQnsb_pH09X2fKKys.AndN1oesf5svc7FkjVdOpkzJiiK_E8O0SZAPcE2EKrI",
        epub : "ay9gY-BG2oBtwl-Dr_ElBb7Cb7qrRHAUCRpOWp6-hcs.2c4Nv8KA3M-k56fadsYZclEzppNm8dMa3X0jjEKGlcE"       
    }
    fg.Set("asdasd",{},"",)
    await fg.userLogin("yokowasis2","123123123");
    // console.log (fg.user);    
    // await chat.send(pairkey,"Test 2 ways chat sent Test 3")
    // .then(s=>{
    //     console.log(s)
    // })
    // Put to Penerima userspace/chat-with/publickey/year/month/day * 2, Pengirim dan Penerima
    let data = await chat.retrieve(pairkey,[2021,9,30]);

    // fg.Del(`~${fg.user.pair.pub}/chat-with`)
    // .then(s=>{
    //     console.log(s);
    // })
    // let data = await fg.userGet(`chat-with`)
    console.log (data);    
})()