import Gun from 'gun';
import {Firegun} from './firegun'

const gun = Gun();
const fg = new Firegun(undefined,"radata",undefined,undefined,undefined,8766)
var arr:{[x:string] : any} = {};

console.time("FINISH")

function generateDataFG() {
    var k=1;
    for (let i = 1; i <= 10; i++) {
        arr[i.toString()] = {}
        for (let j = 0; j <= 100; j++) {
            arr[i.toString()][j.toString()] = {
                username : `username-${i}-${j}`,
                nis : `nis-${i}-${j}`,
                password : `password-${i}-${j}`,
                nama : `nama-${i}-${j}`,
                nik : `nik-${i}-${j}`,
                nik2 : `nik2-${i}-${j}`,
                status : `status-${i}-${j}`,
            };
        }
    }
    fg.Put("siswa/IX/IT",arr)
    .then(s=>{
        console.log(s);
        console.timeEnd("GO")
    })
    .catch(s=>{
        console.log(s);
    })
    
}

function generateDataGun() {
    gun.get("siswa").get("IX").get("IT").put(arr,ack=>{
        console.log (ack);
        console.timeEnd("GO")
    })    
}

async function loadDataFG() {
    let s = await fg.Load(`siswa/IX/IT/2`,true)
    console.log(s);
    console.timeEnd("FINISH");
}

function loadDataGun() {
    // @ts-ignore
    gun.get("siswa").get("IX").get("IT").map().once(s=>{
        console.log(s.nama);
    })
}

loadDataFG();
// loadDataGun();
// generateDataFG();