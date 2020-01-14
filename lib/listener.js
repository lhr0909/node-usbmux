"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const debug_1 = require("./debug");
const devices_1 = require("./devices");
const address_1 = require("./address");
const protocol_1 = require("./protocol");
const error_1 = require("./error");
function createListener() {
    const conn = net.connect(address_1.address);
    const req = protocol_1.protocol.listen;
    const parse = protocol_1.protocol.makeParser(function onMsgComplete(msg) {
        debug_1.debug.listen('Response: \n%o', msg);
        if (msg.MessageType === 'Result' && msg.Number !== 0) {
            conn.emit('error', new error_1.UsbmuxdError('Listen failed', msg.Number));
            conn.end();
        }
        if (msg.MessageType === 'Attached') {
            devices_1.devices[msg.Properties.SerialNumber] = msg.Properties;
            conn.emit('attached', msg.Properties.SerialNumber);
        }
        if (msg.MessageType === 'Detached') {
            Object.keys(devices_1.devices).forEach(function (key) {
                if (devices_1.devices[key].DeviceID === msg.DeviceID) {
                    conn.emit('detached', devices_1.devices[key].SerialNumber);
                    delete devices_1.devices[key];
                }
            });
        }
    });
    debug_1.debug.listen('Request: \n%s', req.slice(16).toString());
    conn.on('data', parse);
    process.nextTick(function () {
        conn.write(req);
    });
    return conn;
}
exports.createListener = createListener;
//# sourceMappingURL=listener.js.map