import * as net from 'net';
import { EventEmitter } from 'events';

import { debug } from './debug';
import { devices } from './devices';
import { createListener } from './listener';
import { connect } from './connect';

/**
 * Creates a new tcp relay to a port on connected usb device
 *
 * @constructor
 * @param {integer} devicePort          - Port to connect to on device
 * @param {integer} relayPort           - Local port that will listen as relay
 * @param {object}  [opts]              - Options
 * @param {integer} [opts.timeout=1000] - Search time (ms) before warning
 * @param {string}  [opts.udid]         - UDID of specific device to connect to
 *
 * @public
 */
export class Relay extends EventEmitter {
  private _devicePort: number;
  private _relayPort: number;
  private _udid: string;
  private _listener;
  private _server;

  constructor(devicePort: number, relayPort: number, opts: { timeout?: number, udid: string }) {
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

  /**
   * Stops the relay
   */
  public stop() {
    this._listener.end();
    this._server.close();
  }

  /**
   * Debugging wrapper for emits
   *
   * @param {string} event
   * @param {*}      [data]
   */
  private _emit(event: string, data?: any) {
    debug.relay('Emit: %s', event + ((data) ? ', Data: ' + data : ''));
    this.emit(event, data);
  }

  /**
   * Starts a usbmuxd listener
   *
   * Relay will start searching for connected devices and issue a warning if a
   * device is not found within the timeout. If/when a device is found, it will
   * emit a ready event.
   *
   * Listener events (attach, detach, error) are passed through as relay events.
   *
   * @param {integer} [timeout=1000] - Search time (ms) before warning
   */
  private _startListener(timeout: number = 1000): void {
    const _this = this;

    const timer = setTimeout(() => {
      // no UDID was given and no devices found yet
      if (!_this._udid && !Object.keys(devices).length) {
        _this._emit('warning', new Error('No devices connected'));
      }
      // UDID was given, but that device is not connected
      if (_this._udid && !devices[_this._udid]) {
        _this._emit('warning', new Error('Requested device not connected'));
      }
    }, timeout || 1000);

    function readyCheck(udid) {
      if (_this._udid && _this._udid !== udid) return;
      _this._emit('ready', udid);
      _this._listener.removeListener('attached', readyCheck);
      clearTimeout(timer);
    }

    this._listener = createListener()
      .on('attached', readyCheck)
      .on('attached', _this._emit.bind(this, 'attached'))
      .on('detached', _this._emit.bind(this, 'detached'))
      .on('error', _this._emit.bind(this, 'error'));
  }

  /**
   * Start local TCP server that will pipe to the usbmuxd tunnel
   *
   * Server events (close and error) are passed through as relay events.
   */
  private _startServer(): void {
    const _this = this;
    this._server = net.createServer(this._handler.bind(this))
      .on('close', _this._emit.bind(this, 'close'))
      .on('error', function(err) {
        _this._listener.end();
        _this._emit('error', err);
      })
      .listen(this._relayPort);
  }

  /**
   * Handle & pipe connections from local server
   *
   * Fires error events and connection begin / disconnect events
   *
   * @param {net.Socket} conn - The local connection socket
   */
  private async _handler(conn: net.Socket): Promise<void> {
    // emit error if there are no devices connected
    if (!Object.keys(devices).length) {
      this._emit('error', new Error('No devices connected'));
      conn.end();
      return;
    }

    // emit error if a udid was specified but that device isn't connected
    if (this._udid && !devices[this._udid]) {
      this._emit('error', new Error('Requested device not connected'));
      conn.end();
      return;
    }

    // Use specified device or choose one from available devices
    var _this = this
      , udid = this._udid || Object.keys(devices)[0]
      , deviceID = devices[udid].DeviceID;

      try {
    const tunnel = await connect(deviceID, this._devicePort);
        // pipe connection & tunnel together
        conn.pipe(tunnel).pipe(conn);

        _this._emit('connect');

        conn.on('end', function() {
          _this._emit('disconnect');
          tunnel.end();
          conn.end();
        });

        conn.on('error', function() {
          tunnel.end();
          conn.end();
        });
      } catch (err) {
        _this._emit('error', err);
        conn.end();
      }
  }
}
