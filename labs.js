const {Firegun, Chat} = require('./firegun');

const fg = new Firegun([""],"fireDB",true);
const chat = new Chat(fg);

(async()=>{
    await fg.userLogin("yokowasis2","123123123")
    .then(async s=>{
        console.log(s.pair);
        if (s.err) {
            console.log (s);
        } else {
            let pairkey = {
                pub : "EX-Tsw_muNVHSW4txyehsls9j1RQnsb_pH09X2fKKys.AndN1oesf5svc7FkjVdOpkzJiiK_E8O0SZAPcE2EKrI",
                epub : "ay9gY-BG2oBtwl-Dr_ElBb7Cb7qrRHAUCRpOWp6-hcs.2c4Nv8KA3M-k56fadsYZclEzppNm8dMa3X0jjEKGlcE"
            }
            let data = await chat.send(pairkey,"Hello with Encryption")
            if (!data.err) {console.log ("OK")}
        }
    })
})()
