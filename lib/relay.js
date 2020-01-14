"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const events_1 = require("events");
const debug_1 = require("./debug");
const devices_1 = require("./devices");
const listener_1 = require("./listener");
const connect_1 = require("./connect");
class Relay extends events_1.EventEmitter {
    constructor(devicePort, relayPort, opts) {
        super();
        if (!(this instanceof Relay)) {
            return new Relay(devicePort, relayPort, opts);
        }
        this._devicePort = devicePort;
        this._relayPort = relayPort;
        this._udid = opts.udid;
        this._startListener(opts.timeout);
        this._startServer();
    }
    stop() {
        this._listener.end();
        this._server.close();
    }
    _emit(event, data) {
        debug_1.debug.relay('Emit: %s', event + ((data) ? ', Data: ' + data : ''));
        this.emit(event, data);
    }
    _startListener(timeout = 1000) {
        const _this = this;
        const timer = setTimeout(() => {
            if (!_this._udid && !Object.keys(devices_1.devices).length) {
                _this._emit('warning', new Error('No devices connected'));
            }
            if (_this._udid && !devices_1.devices[_this._udid]) {
                _this._emit('warning', new Error('Requested device not connected'));
            }
        }, timeout || 1000);
        function readyCheck(udid) {
            if (_this._udid && _this._udid !== udid)
                return;
            _this._emit('ready', udid);
            _this._listener.removeListener('attached', readyCheck);
            clearTimeout(timer);
        }
        this._listener = listener_1.createListener()
            .on('attached', readyCheck)
            .on('attached', _this._emit.bind(this, 'attached'))
            .on('detached', _this._emit.bind(this, 'detached'))
            .on('error', _this._emit.bind(this, 'error'));
    }
    _startServer() {
        const _this = this;
        this._server = net.createServer(this._handler.bind(this))
            .on('close', _this._emit.bind(this, 'close'))
            .on('error', function (err) {
            _this._listener.end();
            _this._emit('error', err);
        })
            .listen(this._relayPort);
    }
    async _handler(conn) {
        if (!Object.keys(devices_1.devices).length) {
            this._emit('error', new Error('No devices connected'));
            conn.end();
            return;
        }
        if (this._udid && !devices_1.devices[this._udid]) {
            this._emit('error', new Error('Requested device not connected'));
            conn.end();
            return;
        }
        var _this = this, udid = this._udid || Object.keys(devices_1.devices)[0], deviceID = devices_1.devices[udid].DeviceID;
        try {
            const tunnel = await connect_1.connect(deviceID, this._devicePort);
            conn.pipe(tunnel).pipe(conn);
            _this._emit('connect');
            conn.on('end', function () {
                _this._emit('disconnect');
                tunnel.end();
                conn.end();
            });
            conn.on('error', function () {
                tunnel.end();
                conn.end();
            });
        }
        catch (err) {
            _this._emit('error', err);
            conn.end();
        }
    }
}
exports.Relay = Relay;
//# sourceMappingURL=relay.js.map