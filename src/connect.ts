import * as net from 'net';

import { debug } from './debug';
import { address } from './address';
import { protocol } from './protocol';
import { UsbmuxdError } from './error';

/**
 * Connects to a device through usbmuxd for a tunneled tcp connection
 *
 * @param  {integer}  deviceID   - Target device's usbmuxd ID
 * @param  {integer} devicePort - Port on ios device to connect to
 * @return {Promise}
 * - resolves {net.Socket} - Tunneled tcp connection to device
 * - rejects  {Error}
 */
export async function connect(deviceID: number, devicePort: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const conn = net.connect(address);
    const req = protocol.connect(deviceID, devicePort);

    /**
     * Handle complete messages from usbmuxd
     * @function
     */
    var parse = protocol.makeParser(function onMsgComplete(msg) {
      debug.connect('Response: \n%o', msg);

      if (msg.MessageType === 'Result' && msg.Number === 0) {
        conn.removeListener('data', parse);
        resolve(conn);
        return;
      }

      // anything other response means it failed
      reject(new UsbmuxdError('Tunnel failed', msg.Number));
      conn.end();
    });

    debug.connect('Request: \n%s', req.slice(16).toString());

    conn.on('data', parse);
    process.nextTick(function() {
      conn.write(req);
    });
  });
}
