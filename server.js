import express from 'express';
import Gun from 'gun';
import 'gun/axe.js'

const port = 9482;

var app = express();
// @ts-ignore
app.use(Gun.serve);
app.use(express.static('./'));

var server = app.listen(port);
var gun = Gun({ file: 'data', web: server });

console.log('Server started on port ' + port + ' with /gun');