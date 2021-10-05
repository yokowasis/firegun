const {Firegun, Chat} = require("./firegun-js")

const fg = new Firegun();
const chat = new Chat(fg);



(async (s)=>{
    const user1 = {
        pub: 'eaA5IcDOyMEsP_ApW--uWUGo4toNNXh2eetC-fNbLLY.J1gkB0xBnp_yrMkN6Q0FyWNWxPufjOMKhkpSdAEAIqg',
        priv: 'ql82TOo6GWmi_Fb0ms-BeriIk5fY4TWS7NAvbCzvoe8',
        epub: 'ix1RvEMck-DAd8158pa6Rgzm88ej-Y2aqfO0Eo86_d4.5RTVW3TXey3s-ilsUSNmMBCTzz7xc-ohFn34xiYzvQU',
        epriv: '2HJikcD9GWk1-iAGeFjE3FKEIWcoYL4-UBSZ1tnxNnY'
      }
    const user2 = {
        pub: '9_itbIgq7UtXA88SNh0sOvufFzxbdt6Nu8EC3lPhOic.fSp-d-MLVlrndXo6SDM2wEIWPh2tLD73K3TdcDfXwYE',
        priv: 'iCtxpSDjjnF9bNRRwNg4kBvaaXFTFxMSGKB7SbPz5Zg',
        epub: 'nIERn4_2ZyaphvoJHo2i6-fQsMQ_gTtqCLcmoCaDtbE.HvbXsr67FuimdGphbQCSQ7DlfYlHcY_ZjOmMRiViJH0',
        epriv: '-nlRKSw4eswpJ4aUEL9WmXe1blpyBZEFUPqgMxfqFco'
    }

    // User1 Login
    await fg.loginPair(user1)
})()