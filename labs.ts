import { Firegun } from './index';

// const fs = require('fs')
// fs.readFile('./fireDB/!', 'utf8', (err:any, jsonString:any) => {
//     if (err) {
//         console.log("File read failed:", err)
//         return
//     }
//     console.log('File data:', JSON.parse(jsonString)["~"]) 
// })

const fg = new Firegun({
    peers : ["https://gun-relay.bimasoft.web.id:16902/gun"]
});

(async ()=>{
    
})()