import * as net from 'net';

import { debug } from './debug';
import { devices } from './devices';
import { address } from './address';
import { protocol } from './protocol';
import { UsbmuxdError } from './error';

/**
 * Connects to usbmuxd and listens for ios devices
 *
 * This connection stays open, listening as devices are plugged/unplugged and
 * cant be upgraded into a tcp tunnel. You have to start a second connection
 * with connect() to actually make tunnel.
 *
 * @return {net.Socket} - Socket with 2 bolted on events, attached & detached:
 *
 * Fires when devices are plugged in or first found by the listener
 * @event net.Socket#attached
 * @type {string} - UDID
 *
 * Fires when devices are unplugged
 * @event net.Socket#detached
 * @type {string} - UDID
 *
 * @public
 */
export function createListener(): net.Socket {
  const conn = net.connect(address);
  const req = protocol.listen;

  /**
   * Handle complete messages from usbmuxd
   * @function
   */
  const parse = protocol.makeParser(function onMsgComplete(msg) {
    debug.listen('Response: \n%o', msg);

    // first response always acknowledges / denies the request:
    if (msg.MessageType === 'Result' && msg.Number !== 0) {
      conn.emit('error', new UsbmuxdError('Listen failed', msg.Number));
      conn.end();
    }

    // subsequent responses report on connected device status:
    if (msg.MessageType === 'Attached') {
      devices[msg.Properties.SerialNumber] = msg.Properties;
      conn.emit('attached', msg.Properties.SerialNumber);
    }

    if (msg.MessageType === 'Detached') {
      // given msg.DeviceID, find matching device and remove it
      Object.keys(devices).forEach(function(key) {
        if (devices[key].DeviceID === msg.DeviceID) {
          conn.emit('detached', devices[key].SerialNumber);
          delete devices[key];
        }
      });
    }
  });

  debug.listen('Request: \n%s', req.slice(16).toString());

  conn.on('data', parse);
  process.nextTick(function() {
    conn.write(req);
  });

  return conn;
}
