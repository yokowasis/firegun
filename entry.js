import {Firegun, Chat} from './firegun'

var fg = new Firegun();
var chat = new Chat(fg);

global.fg = fg;
global.chat = chat;