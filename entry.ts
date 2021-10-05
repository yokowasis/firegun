import {Firegun, Chat} from "./firegun"

var fg = new Firegun(["https://fire-gun.herokuapp.com/gun"])
var chat = new Chat(fg);

// @ts-ignore
global.fg = fg;
// @ts-ignore
global.chat = chat;