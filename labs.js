const {Firegun} = require('./firegun');

const fg = new Firegun(null,null,true);

(async()=>{
    fg.Get("level0/level1/level2/level3/0")
    .then(data=>{
        console.log (data.dummy);
    })
})()
