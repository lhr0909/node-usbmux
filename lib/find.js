"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devices_1 = require("./devices");
const listener_1 = require("./listener");
async function findDevice(opts) {
    return new Promise((resolve, reject) => {
        var listener = listener_1.createListener();
        opts = opts || {};
        var timer = setTimeout(function () {
            listener.end();
            (opts.udid)
                ? reject(new Error('Requested device not connected'))
                : reject(new Error('No devices connected'));
        }, opts.timeout || 1000);
        listener.on('attached', function (udid) {
            if (opts.udid && opts.udid !== udid)
                return;
            listener.end();
            clearTimeout(timer);
            resolve(devices_1.devices[udid].DeviceID);
        });
    });
}
exports.findDevice = findDevice;
//# sourceMappingURL=find.js.map