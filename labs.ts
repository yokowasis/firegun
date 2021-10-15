import {Firegun} from './firegun';
const fg = new Firegun();

(async ()=>{
    let success = await fg.addContentAdressing ("#permanentStuff",{
        "Hello" : "Can't Touch Me"
    })    
    fg.gun.get("#permanentStuff").map().once(s=>{
        console.log(s);
    })
})()