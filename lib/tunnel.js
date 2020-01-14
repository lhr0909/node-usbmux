"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devices_1 = require("./devices");
const connect_1 = require("./connect");
const find_1 = require("./find");
async function getTunnel(devicePort, opts) {
    opts = opts || {};
    let udid;
    let deviceID;
    if (opts.udid && devices_1.devices[opts.udid]) {
        deviceID = devices_1.devices[opts.udid].DeviceID;
        return connect_1.connect(deviceID, devicePort);
    }
    if (!opts.udid && Object.keys(devices_1.devices).length) {
        udid = Object.keys(devices_1.devices)[0];
        deviceID = devices_1.devices[udid].DeviceID;
        return connect_1.connect(deviceID, devicePort);
    }
    return find_1.findDevice(opts).then(function (deviceID) {
        return connect_1.connect(deviceID, devicePort);
    });
}
exports.getTunnel = getTunnel;
//# sourceMappingURL=tunnel.js.map