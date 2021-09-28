//@ts-check
const {Firegun} = require('./firegun');

const fg = new Firegun([""],"fireDB",true);

(async()=>{
    fg.Put("hello/world","test")
    .then(s=>{
        console.log(s);
    })
})()
