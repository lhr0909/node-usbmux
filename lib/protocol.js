"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plist = require("plist");
exports.protocol = (function () {
    function pack(payload_obj) {
        var payload_plist = plist.build(payload_obj), payload_buf = Buffer.from(payload_plist);
        var header = {
            len: payload_buf.length + 16,
            version: 1,
            request: 8,
            tag: 1
        };
        var header_buf = Buffer.alloc(16);
        header_buf.fill(0);
        header_buf.writeUInt32LE(header.len, 0);
        header_buf.writeUInt32LE(header.version, 4);
        header_buf.writeUInt32LE(header.request, 8);
        header_buf.writeUInt32LE(header.tag, 12);
        return Buffer.concat([header_buf, payload_buf]);
    }
    function byteSwap16(val) {
        return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
    }
    var listen = pack({
        MessageType: 'Listen',
        ClientVersionString: 'node-usbmux',
        ProgName: 'node-usbmux'
    });
    function connect(deviceID, port) {
        return pack({
            MessageType: 'Connect',
            ClientVersionString: 'node-usbmux',
            ProgName: 'node-usbmux',
            DeviceID: deviceID,
            PortNumber: byteSwap16(port)
        });
    }
    function makeParser(onComplete) {
        var len, msg;
        return function parse(data) {
            if (!len) {
                len = data.readUInt32LE(0) - 16;
                msg = '';
                data = data.slice(16);
                if (!data.length)
                    return;
            }
            var body = data.slice(0, len);
            msg += body;
            len -= body.length;
            if (len === 0)
                onComplete(plist.parse(msg));
            data = data.slice(body.length);
            if (data.length)
                parse(data);
        };
    }
    return {
        listen: listen,
        connect: connect,
        makeParser: makeParser
    };
})();
//# sourceMappingURL=protocol.js.map