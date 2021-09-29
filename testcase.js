// WINDOW 1
yokopair = {
    "pub": "Pj87M2bJ2gKvYx8N7IOsIv_vc_HwmgpY_es4J1iHdE4.rVbLzDxjTsQVNnm-ymOvygKcN-N0FKn2xlV36no8ZOE",
    "epub": "SkdwuFVN9W8p2UAQ-H4Ng5OGZp3Uujb_eebCQlGZe3Q.fbJE7XXpyR1aE4KGBHOGWDW0wlxyG5mHFnSp37sYKyw",
    "priv": "xZYuhnKQ98sCLiiZFBFDWJsMTzBFHuuIqFxkw882Mgc",
    "epriv": "zPmNmSuiArnHTQ7goN-Ya_x0wvzYY8QFjD9Jrl5643o"
  }
  gun
    .user()
    .auth(yokopair, async (user) => {
      console.log(gun.user().is)
      let cert = await SEA.certify("*", [{
        "*": "chat-with"
      }], yokopair, null, {
        blacklist: 'chat-blacklist'
      });
      gun.user()
        .get("chat-cert")
        .put(cert, ack => {
          console.log(ack);
        });
    })

// WINDOW 2
yokopub = "Pj87M2bJ2gKvYx8N7IOsIv_vc_HwmgpY_es4J1iHdE4.rVbLzDxjTsQVNnm-ymOvygKcN-N0FKn2xlV36no8ZOE";
yoko2pair = {
    "pub": "5uasw8_Hrcnf8_Gvq9gK8e51i4-0yOsQM6pFm8GZ-GU.eClKAroj6vuqZsEs1ZKhVyn480RJgXyDpm88TikAyc0",
    "epub": "86AejRrSE1BljpPcVNKmwbTaVM3RN6hmHvDPvEDcAq4.DTu8DEohnfHOf5Fx8aJyaJDUdwNbiVLWK8rLN5pqWAA",
    "priv": "4plWUjxhC1_SI16LaftSs536-pU0uk-IK-A6AxaNcjk",
    "epriv": "trjttePG1T-m3zL-2SZ2aySWYTqLkxLroof8mfLZM9Y"
  }

gun
  .user()
// Auth User
  .auth(yoko2pair, async (user) => {
//   Get Cert
    gun
      .get(`~${yokopub}`)
      .get("chat-cert")
      .once(async (cert) => {
      	console.log (cert);
//       put data
      	gun
	      .get(`~${yokopub}`)
	      .get(`chat-with`)
      	.get(`hello`)
      	.put({"Hello" : "World"},ack=>{
          console.log (ack);
        },{
          opt : {
            cert : cert
          }
        })
      })
  })

