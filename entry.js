import {Firegun, Chat} from './firegun'


var gun = new Firegun();
var chat = new Chat(gun);

global.gun = gun;
global.chat = chat;