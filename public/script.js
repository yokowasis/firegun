import {Firegun, Chat} from '../firegun-browser.js'
let fg = new Firegun(["https://fire-gun.herokuapp.com/gun"],undefined,true);
let chat = new Chat(fg)    

window.fg = fg;
window.chat = chat;

let users = {}
users.user1 = {
    "alias" : "user1",
    "pub": "819hkcPrDR09ao2FmiV1FpemF8Bt2fTJ1mk6lMIfxCk.hk_OlCysl54MAmkJT_UQkxYirIQfj7ALzY-mYlJhztI",
    "priv": "9_Idu-dZYUT5i_ueV-pJgmT2vX47vnPO4fU9nE9bKuo",
    "epub": "rljfi75sNnxfjUvyXeeRrHaRMp-Ts8G5blv5_X-cb1o.LL2JhRMwBC4fvhp1R8hGF1It51XosWGD4FAd15ARq-g",
    "epriv": "di2euxikCzcloeBcnphO0TvtPVZ-CgPyBq8Zp9DXme4"
}

users.user2 = {
    "alias" : "user2",
    "pub": "H19-CbnlB9uvuuCiDQ3hBMm84TWj4W2cGkQmX9rU6WI.uwsBBd29CxapkD_mEjI8h5IQR4ip9i2Xz2uBXsFjiFQ",
    "priv": "k57MTlD2WLpEXmOH3B062fEdrL0Sfk4CmCGeg35_vUg",
    "epub": "qAwIyquACtJ2vvfvsUTFT8ur1THz1UgsFOPfnrRdfDc.MYc0TEn873qOYgMrYGHmVgbQb_HEHrw8hhX-Zq-NoP8",
    "epriv": "c6u3v7VcamWVKQSBJWPzVQCxdFraBeqSAyplI8pfw2A"
}

users.user3 = {
    "alias" : "user3",
    "pub": "evWVcVzfKu8-rs7TXTQoi0f_GXJbKpuvyzGPwQ3biC4.NdfVDVTZJkLHaKfeeZW9aiHj_aviQ7Tp0bUYAIrOG4M",
    "priv": "0kW_DilCyNpYF5MWfHWpHc7gDo5WPf7jfEwciRO6ulw",
    "epub": "SDmdULoHraZjnp2I8JePt_fi3uh9frLVSxUYDuYqZDM.LY-e6u22KnfaF0j3azsUHsVFlYNz82HAYYOdFPkXHDA",
    "epriv": "x08u0AVZFloMfRdOPC5-H4_UM2kvMA25oAX0VbIYMVY"
}

users.user4 = {
    "alias" : "user4",
    "pub": "HA2A-_MpcFI_EpmyWOjxrSCv5BOa6X9wVaMpBbbM4LY.w9lqAL-8UO7qoxi5Cy9jNRgGTHgP1Ri238Qx78YqK6M",
    "priv": "wZdEesVLAr735aLj4krbeuPdV4k3FURQG7mDx6RdWEc",
    "epub": "fHjFrSPOj4j_7uVk7pDDpneM87j3HDXmelEYJMmrXZU.xegKwinxz1TQl4_OE7eO9-R_kW2R0PhoRZv95API88o",
    "epriv": "RQphTEwbOwuWbAs9jq2UsLdpJG3nGYZfhwCsDaIzBUQ"
}

users.user5 = {
    "alias" : "user5",
    "pub": "0CbPupaUMQ8cjGL3t_GmU4uf7ZLFkyK6u4-SyDNrfY4.x6IeptfIme_6eWNq9a2Mrqmu1-VXK2D-5ji9bxqWP64",
    "priv": "zry7i01JjrWlyNJw9Gak7qrdedWrimcgUwlLv59iE9s",
    "epub": "LucliSQWG5TffbKtkUoe1i2jYjkgMKkp3H664yOG_iU.EpRyDvZ725DhegVkat2-g4UC0aVxlHHJh5ZHuuXg1tI",
    "epriv": "_4y7hFSlaeD24Kk9FgsIt1RGx0fXLVAsSCh9FQSG180"
}

window.findAlias = (pubKey) => {
    for (const key in users) {
        if (Object.hasOwnProperty.call(users, key)) {
            const user = users[key];
            if (pubKey === user.pub) {
                return user.alias;
            }
        }
    }
    return "Unknown";
}

window.test = () => {
    console.log ("TESTED!!!!");
}

window.login = async () => {
    let user = document.querySelector("#userLogin").value;
    await fg.userLogout()
    await fg.loginPair(users[user],user);
    document.querySelector("#loggedInUser").innerHTML = fg.user.alias;
}

window.send = async () => {
    console.log ("SENDING CHAT !!!");
    let text = document.querySelector("#chatmsg").value;
    let tujuan = document.querySelector("#to").value;
    try {
        await chat.send(users[tujuan],text)        
        console.log ("CHAT SENT !!!");
    } catch (error) {
        console.log (error)        
    }    

}

window.openChat = async () => {
    let roomname = document.querySelector("#roomname").value;
    if (fg.user.alias === "") {
        console.log ("User Belum Login");
    } else {
        fg.On(`~${fg.user.pair.pub}/chat-with/${users[roomname].pub}/2021/10/03`,async ()=>{
            let chats = await chat.retrieve(users[roomname],['2021','10','03']);
            let name1 = fg.user.alias;
            let name2 = findAlias(users[roomname].pub);
            let html = "";
            console.log (chats);
            for (const key in chats) {
                if (Object.hasOwnProperty.call(chats, key)) {
                    const chat = chats[key];
                    if (chat._self) {
                        html += `
                        <div class="d-flex flex-row mb-3">
                            <div class="card" style="width: 18rem;">
                                <div class="card-body">
                                    <h5 class="card-title text-primary fw-bold">${name1}</h5>
                                    <h6 class="card-subtitle mb-2 fs-6 text-muted">${chat.timestamp}</h6>
                                    <p class="card-text">${chat.msg}</p>
                                </div>
                            </div>
                        </div>
                        `;    
                    } else {
                        html += `
                        <div class="d-flex flex-row-reverse mb-3">
                            <div class="card" style="width: 18rem;">
                                <div class="card-body">
                                    <h5 class="card-title text-primary fw-bold">${name2}</h5>
                                    <h6 class="card-subtitle mb-2 fs-6 text-muted">${chat.timestamp}</h6>
                                    <p class="card-text">${chat.msg}</p>
                                </div>
                            </div>
                        </div>
                        `;    
                    }
                }
            }
            document.getElementById("chatMessage").innerHTML = html;
        })
        console.log ("ON !!!");    
    }
}

window.genAllCert = async () => {
    document.getElementById("certBtn").innerHTML = "Proses ..."
    for (const user in users) {
        if (Object.hasOwnProperty.call(users, user)) {
            const keypair = users[user];
            await fg.loginPair(keypair);
            await chat.generatePublicCert();
            await fg.userLogout()
        }
    }
    document.getElementById("certBtn").innerHTML = "Generate Cert"
}