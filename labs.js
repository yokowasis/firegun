//@ts-check
const {Firegun} = require('./firegun');

const fg = new Firegun([""],"fireDB",true);

(async()=>{
    fg.Put("hello",{
        "Normal" : "String",
        "Normal2" : "String",
        "Normal3" : "String",
        "Level1" : {
            "Level1String" : "String"
        },
        "Level2" : {
            "Level2String" : "String",
            "Level3" : {
                "Level3String" : "String"
            }    
        }
    })
    fg.Load("hello")
    .then(s=>{
        console.log(s);
    })
})()
