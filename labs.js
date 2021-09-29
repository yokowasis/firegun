const {Firegun, Chat} = require('./firegun');

const fg = new Firegun([""],"fireDB",true);
const chat = new Chat(fg);

(async()=>{

    await fg.userLogin("yokowasis2","123123123")
    .then(async s=>{
        if (s.err) {
            console.log (s);
        } else {
            console.log ("go");
            let yokopub = "6vzIYT4m2UJMQKfnB2bET-FE2WqDzDTJ6cGqnwOLHVE.Rzl4fwR5m2OmnpDX24v0M9QHrEuUg6mjsiHrA46QwAk";
            console.log (fg.user.pair.pub);
            let cert = await fg.Get(`~${yokopub}/chat-cert`);
            console.log (cert);
            let aa = await fg.Put(`~${yokopub}/chat-with` , {
                "halo" : "Juga",
                "sip" : "Oke"
            },undefined,{
                opt : {
                    cert : cert
                }
            })
            console.log (aa);
            // await fg.Put(`~${yokopub}/chat-with/yokowasis2`, {
            //     "Hello" : "World"
            // },undefined,{
            //     opt : {
            //         cert : cert
            //     }
            // })
            console.log ("DONE");
            // // let x = await chat.send(yokopub,"Hello World");
            // await fg.Put(`~${yokopub}/chat-with/${fg.user.pair.pub}`,{
            //     "Hello" : "WOrld"
            // },undefined,{
            //     opt : {
            //         cert : cert
            //     }
            // })
            // let data =  fg.Get(`~${yokopub}/chat-with/${fg.user.pair.pub}`).then(s=>{console.log(s)})
        }
    })
})()
