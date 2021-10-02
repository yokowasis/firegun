let users = {}
users.user1 = {
    "pub": "819hkcPrDR09ao2FmiV1FpemF8Bt2fTJ1mk6lMIfxCk.hk_OlCysl54MAmkJT_UQkxYirIQfj7ALzY-mYlJhztI",
    "priv": "9_Idu-dZYUT5i_ueV-pJgmT2vX47vnPO4fU9nE9bKuo",
    "epub": "rljfi75sNnxfjUvyXeeRrHaRMp-Ts8G5blv5_X-cb1o.LL2JhRMwBC4fvhp1R8hGF1It51XosWGD4FAd15ARq-g",
    "epriv": "di2euxikCzcloeBcnphO0TvtPVZ-CgPyBq8Zp9DXme4"
}

users.user2 = {
    "pub": "H19-CbnlB9uvuuCiDQ3hBMm84TWj4W2cGkQmX9rU6WI.uwsBBd29CxapkD_mEjI8h5IQR4ip9i2Xz2uBXsFjiFQ",
    "priv": "k57MTlD2WLpEXmOH3B062fEdrL0Sfk4CmCGeg35_vUg",
    "epub": "qAwIyquACtJ2vvfvsUTFT8ur1THz1UgsFOPfnrRdfDc.MYc0TEn873qOYgMrYGHmVgbQb_HEHrw8hhX-Zq-NoP8",
    "epriv": "c6u3v7VcamWVKQSBJWPzVQCxdFraBeqSAyplI8pfw2A"
}

users.user3 = {
    "pub": "evWVcVzfKu8-rs7TXTQoi0f_GXJbKpuvyzGPwQ3biC4.NdfVDVTZJkLHaKfeeZW9aiHj_aviQ7Tp0bUYAIrOG4M",
    "priv": "0kW_DilCyNpYF5MWfHWpHc7gDo5WPf7jfEwciRO6ulw",
    "epub": "SDmdULoHraZjnp2I8JePt_fi3uh9frLVSxUYDuYqZDM.LY-e6u22KnfaF0j3azsUHsVFlYNz82HAYYOdFPkXHDA",
    "epriv": "x08u0AVZFloMfRdOPC5-H4_UM2kvMA25oAX0VbIYMVY"
}

users.user4 = {
    "pub": "HA2A-_MpcFI_EpmyWOjxrSCv5BOa6X9wVaMpBbbM4LY.w9lqAL-8UO7qoxi5Cy9jNRgGTHgP1Ri238Qx78YqK6M",
    "priv": "wZdEesVLAr735aLj4krbeuPdV4k3FURQG7mDx6RdWEc",
    "epub": "fHjFrSPOj4j_7uVk7pDDpneM87j3HDXmelEYJMmrXZU.xegKwinxz1TQl4_OE7eO9-R_kW2R0PhoRZv95API88o",
    "epriv": "RQphTEwbOwuWbAs9jq2UsLdpJG3nGYZfhwCsDaIzBUQ"
}

users.user5 = {
    "pub": "0CbPupaUMQ8cjGL3t_GmU4uf7ZLFkyK6u4-SyDNrfY4.x6IeptfIme_6eWNq9a2Mrqmu1-VXK2D-5ji9bxqWP64",
    "priv": "zry7i01JjrWlyNJw9Gak7qrdedWrimcgUwlLv59iE9s",
    "epub": "LucliSQWG5TffbKtkUoe1i2jYjkgMKkp3H664yOG_iU.EpRyDvZ725DhegVkat2-g4UC0aVxlHHJh5ZHuuXg1tI",
    "epriv": "_4y7hFSlaeD24Kk9FgsIt1RGx0fXLVAsSCh9FQSG180"
}


function test() {
    console.log ("TESTED!!!!");
}

async function login() {
    let user = document.querySelector("#userLogin").value;
    await fg.userLogout()
    await fg.loginPair(users[user]);
    await chat.generatePublicCert();
    document.querySelector("#loggedInUser").innerHTML = fg.user.alias;
}

async function send() {
    let text = document.querySelector("#chatmsg").value;
    let tujuan = document.querySelector("#to").value;
    await chat.send(users[tujuan],text)
    console.log ("CHAT SENT !!!");
}

async function open() {
    let roomname = document.querySelector("#roomname").value;
    let chats = await chat.retrieve(users[roomname]);
    console.log (chats);
}

