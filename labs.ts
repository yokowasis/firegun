import { Firegun } from './index';

const fs = require('fs')
fs.readFile('./fireDB/!', 'utf8', (err:any, jsonString:any) => {
    if (err) {
        console.log("File read failed:", err)
        return
    }
    console.log('File data:', JSON.parse(jsonString)["~"]) 
})

const fg = 
new Firegun([
"https://gundb.myriad.systems/gun"
]);

(async ()=>{
    fg.Put
    ('test/paste',
    "Coba dari local 5x")

})()



