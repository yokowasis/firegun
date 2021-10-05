import {Firegun, Chat} from './firegun.ts'

var fg = new Firegun();
var chat = new Chat(fg);

global.fg = fg;
global.chat = chat;