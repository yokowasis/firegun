import {Firegun, Chat} from "./index"

var fg = new Firegun(["https://fire-gun.herokuapp.com/gun"])
var chat = new Chat(fg);

(global as any).fg = fg;
(global as any).chat = chat;