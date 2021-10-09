import Gun from 'gun';
import {Firegun} from './firegun'

const gun = Gun();
const fg = new Firegun(undefined,undefined,undefined,undefined,undefined,8766)
var arr:{[x:string] : any} = {};

for (let i = 1; i <= 10000; i++) {
    arr[i.toString()] = {
        username : `username-${i}`,
        nis : `nis-${i}`,
        password : `password-${i}`,
        nama : `nama-${i}`,
        nik : `nik-${i}`,
        nik2 : `nik2-${i}`,
        status : `status-${i}`,
    };
}

console.time("GO")
gun.get("siswa").get("IX").get("IT").put(arr,ack=>{
    console.log (ack);
    console.timeEnd("GO")
})
