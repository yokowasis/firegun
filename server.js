import http from "http";
import Gun from "gun";

const server = http.createServer().listen(9482);
const gun = Gun({ web: server });