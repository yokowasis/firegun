const {Firegun} = require('./firegun');

const fg = new Firegun(undefined,undefined,true);

(async()=>{
    fg.Put("test",{
        a : {
            "sub" : "sub-a",
            "sub-sub" : {
                "1level" : "deep",
                "2level" : "deep",
                "3level" : "deep",
                "4level" : {
                    "go" : "LOADDDDD",
                    "5level" : {
                        "yes" : "LOADDDDD"
                    }
                }
            }
        },
        e : "Hello-e",
        f : "Hello-f"
    })
    fg.Load("test")
    .then(s=>{
        console.log (s.a['sub-sub']);
    })
})()
