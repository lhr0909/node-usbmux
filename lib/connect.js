"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const debug_1 = require("./debug");
const address_1 = require("./address");
const protocol_1 = require("./protocol");
const error_1 = require("./error");
async function connect(deviceID, devicePort) {
    return new Promise((resolve, reject) => {
        const conn = net.connect(address_1.address);
        const req = protocol_1.protocol.connect(deviceID, devicePort);
        var parse = protocol_1.protocol.makeParser(function onMsgComplete(msg) {
            debug_1.debug.connect('Response: \n%o', msg);
            if (msg.MessageType === 'Result' && msg.Number === 0) {
                conn.removeListener('data', parse);
                resolve(conn);
                return;
            }
            reject(new error_1.UsbmuxdError('Tunnel failed', msg.Number));
            conn.end();
        });
        debug_1.debug.connect('Request: \n%s', req.slice(16).toString());
        conn.on('data', parse);
        process.nextTick(function () {
            conn.write(req);
        });
    });
}
exports.connect = connect;
//# sourceMappingURL=connect.js.map