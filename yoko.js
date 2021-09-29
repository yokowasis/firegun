const {Firegun, Chat} = require('./firegun');

const fg = new Firegun([""],"fireDB",true,undefined,undefined,8766);
const chat = new Chat(fg);

fg.userLogin("yokowasis","123123123")
.then(s=>{
    console.log (fg.user.pair)
    chat.generatePublicCert()
})
