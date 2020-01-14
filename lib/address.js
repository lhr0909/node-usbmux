"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.address = (process.platform === 'win32')
    ? { port: 27015 }
    : { path: '/var/run/usbmuxd' };
//# sourceMappingURL=address.js.map