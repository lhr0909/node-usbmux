"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UsbmuxdError extends Error {
    constructor(message, number) {
        super(message);
        this.name = 'UsbmuxdError';
        if (number) {
            this.number = number;
            this.message += ', Err #' + number;
        }
        if (number === 2)
            this.message += ": Device isn't connected";
        if (number === 3)
            this.message += ": Port isn't available or open";
        if (number === 5)
            this.message += ": Malformed request";
    }
}
exports.UsbmuxdError = UsbmuxdError;
//# sourceMappingURL=error.js.map