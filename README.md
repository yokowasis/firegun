# Firegun
- [Firegun](#firegun)
- [Why the Name?](#why-the-name)
- [What is it ?](#what-is-it-)
- [Quickstart](#quickstart)
  - [Installation](#installation)
  - [Include the module](#include-the-module)
  - [Initialization](#initialization)
  - [Do](#do)
- [API Reference](#api-reference)
  - [Public Space](#public-space)
    - [Get](#get)
    - [Load](#load)
    - [Put](#put)
  - [Userspace](#userspace)
    - [Create new User (it logged them in automatically)](#create-new-user-it-logged-them-in-automatically)
    - [Login User](#login-user)
    - [Logout User](#logout-user)
    - [Get Data from User Space](#get-data-from-user-space)
    - [Get Data from User Space](#get-data-from-user-space-1)
    - [Put Data to User Space](#put-data-to-user-space)
  - [SEASpace](#seaspace)
    - [Put Permanent Readonly Content](#put-permanent-readonly-content)
    - [Generate KeyPair](#generate-keypair)
    - [Login to Userspace with KeyPair](#login-to-userspace-with-keypair)
# Why the Name?
Because it's inspired by fireship youtube video, and I am trying to replace Firestore with GunDB (Decentralized Database)

# What is it ?
It's a wrapper for gunDB. gunDB is great, but sometimes the docs is confusing.

# Quickstart
## Installation
```
npm i gun @yokowasis/firegun
```

## Include the module
```
import { Firegun } from '@yokowasis/firegun'
// or
const Fg = require('@yokowasis/firegun');
const Firegun = Fg.Firegun;
```
## Initialization
```
let fg = new Firegun();
```
## Do
```
var data = {
    "Hello" : "World"
}

//Put Some Data
let success = await fg.Put("data/dummy",data);

//Retrieve Some Data
let retrieveData = await fg.Get("data/dummy");
```
# API Reference
## Public Space
### Get
```
let data = await fg.Get("path/to/the/things")
```
### Load
```
// Load Multi Nested Data
let data = await fg.Load("path/to/the/things")
```
### Put
```
let success = await fg.Put("path/to/the/things",{
    "hello" : "world",
    "parent" : {
      "nested" : "data"
    }
})
```
## Userspace
**What is it ?**
It's a space for user. The data written in this way is readonly for the public.
### Create new User (it logged them in automatically)
```
await fg.userNew ("username", "password")
console.log (fg.user)
```
### Login User
```
await fg.userLogin ("username", "password")
console.log (fg.user)
```
### Logout User
```
await fg.userLogout ()
console.log (fg.user)
```
### Get Data from User Space
```
let data = await fg.userGet ("mydata")
```
### Get Data from User Space
```
//Load Multi Nested Data
let data = await fg.userLoad ("mydata")
```
### Put Data to User Space
```
let success = await fg.userPut ("mydata",{
    "Hello" : "Userspace"
})
```
## SEASpace
**What is it?** It's like the UserSpace, but without the username / password

### Put Permanent Readonly Content 
```
//Key Must begin with "#"
let success = fg.addContentAdressing("#permanentStuff",{
    "Hello" : "Can't Touch Me"
})

//Try to read it
let data = await fg.Get("#permanentStuff");
for (const key in data) {
  const element = data[key];
  console.log (element);
}

//or using gun.map()
fg.gun.get("#permanentStuff").map().once(element=>{
    console.log (element)
})

//Try to change it
let success = await fg.Put("#permanentStuff",{
    "New"   : "entry"
})
//will fail
```
### Generate KeyPair
**What is it for ?** it's to create a user without username / password.
```
let keyPair = await fg.generatePair();
```
### Login to Userspace with KeyPair
```
await fg.loginPair (keyPair);
console.log (fg.user);
```
