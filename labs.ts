// @ts-nocheck
import { Firegun } from './index';
const fg = new Firegun();

(async ()=>{

    // var randomNode = fg.gun.get("random").get("Node").put({
    //     "t" : "random ASDASD"
    // });

    // var sometest = fg.gun.get("some").get("test");
    // fg.gun.get("some").get("test").put(sometest);

    // fg.gun.get("some").get("test").put({
    //     "childtest" : "test-data"
    // },()=>{
    //     fg.gun.get("some").get("test").once(s=>{
    //         console.log (s);
    //     })    
    // });

    // fg.Del()

    // fg.gun.get("random").get("Node").once(s=>{
    //     console.log (s);
    // })

    // fg.gun.get("some/test").once(s=>{
    //     console.log (s);
    // })

    // fg.gun.get("some").get("test").get("t").once(s=>{
    //     console.log (s);
    // })

    // fg.gun.get("some").get("test").get("v").put(null).once(s=>{
    //     console.log (s);
    // })

    fg.gun.get("random/Node/v/insider").once(s=>{
        console.log (s);
    })

    // fg.gun.get("some/test/t").once(s=>{
    //     console.log (s);
    // })

    // fg.Del("random/Node")

    // fg.gun.get("some").once(s=>{
    //     console.log (s);
    // })

    // await fg.userLogin("yokowasis","222222222")
    // .catch(err=>{
    //     console.log(err);
    // })

    // fg.userPut("test","AAAAAAA");
    
    // console.log(fg.user.pair);

    // fg.userNew("yodi","222222222")
    // .catch(err=>{
    //     console.log(err)
    // })    


    console.log ("AAAA");
})()



