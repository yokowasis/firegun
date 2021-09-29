const {Firegun, Chat} = require('./firegun');

const fg = new Firegun([""],"fireDB",true,undefined,undefined,8767);

(async ()=>{
    await fg.userNew("yokowasis","123123123")
    fg.userLogout();
    
    await fg.userNew("yokowasis2","123123123")
    fg.userLogout();
    
    console.log ("DONE");    
})()
