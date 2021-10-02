cert = await Gun.SEA.certify("*", [{
    "*": "chat-with",
    "+": "*"
  }], users.user2)
  console.log(cert);
  
  fg.gun
    .get(`~${users.user2.pub}`)
    .get('chat-with')
    .get(users.user1.pub)
    .get('2021')
    .get('10')
    .get('2')
    .get('6GR4pzZDPhoLgphLejOIrIeCpz0rEZ')
    .put({
      "test": "OK"
    }, s => {
      console.log(s);
    }, {
      opt : {
        cert: cert
      }
    })
  
  
    fg.Put(`~${users.user2.pub}/chat-with/${users.user1.pub}/2021/10/2/6GR4pzZDPhoLgphLejOIrIeCpz0rEZ`, {
        "test": "OK"
      },undefined,{
      opt : {
        cert : cert
      }
    })


    fg.Put(`~H19-CbnlB9uvuuCiDQ3hBMm84TWj4W2cGkQmX9rU6WI.uwsBBd29CxapkD_mEjI8h5IQR4ip9i2Xz2uBXsFjiFQ/chat-with/819hkcPrDR09ao2FmiV1FpemF8Bt2fTJ1mk6lMIfxCk.hk_OlCysl54MAmkJT_UQkxYirIQfj7ALzY-mYlJhztI/2021/10/2/randomString`,{
        "_self": false,
        "timestamp": "2/10/2021 @ 10:29:31",
        "msg": "SEA{\"ct\":\"t8LOCWqsZkKCcfmVTaACGPhF28FqxAYm8WJakmXZvkCTWgmbxogbQYbddVqBtOUm+9DTcRur4g==\",\"iv\":\"RH/Yu+qw1ANm02hHr90m\",\"s\":\"uB51hLSKQ5az\"}",
        "status": "sent"
      },undefined,{
        opt :  {
          cert : cert
        }
      })
      .then(s=>{
        console.log (s);
      })

      fg.gun
      .get('~H19-CbnlB9uvuuCiDQ3hBMm84TWj4W2cGkQmX9rU6WI.uwsBBd29CxapkD_mEjI8h5IQR4ip9i2Xz2uBXsFjiFQ')      
      .get('chat-with')
      .get('819hkcPrDR09ao2FmiV1FpemF8Bt2fTJ1mk6lMIfxCk.hk_OlCysl54MAmkJT_UQkxYirIQfj7ALzY-mYlJhztI')
      .get('2021')
      .get('10')
      .get('2')
      .get('randomString')
      .put(
          {
            "_self": false,
            "timestamp": "2/10/2021 @ 10:29:31",
            "msg": "SEA{\"ct\":\"t8LOCWqsZkKCcfmVTaACGPhF28FqxAYm8WJakmXZvkCTWgmbxogbQYbddVqBtOUm+9DTcRur4g==\",\"iv\":\"RH/Yu+qw1ANm02hHr90m\",\"s\":\"uB51hLSKQ5az\"}",
            "status": "sent"
          }          
      ,ack=>{
          console.log(ack);
      },{
          opt : {
              cert : cert
          }
      })