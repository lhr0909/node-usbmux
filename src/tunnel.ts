
import * as net from 'net';

import { devices } from './devices';
import { connect } from './connect';
import { findDevice } from './find';

/**
 * Get a tunneled connection to a device (specified or not) within a timeout
 *
 * @param  {integer} devicePort          - Port to connect to on device
 * @param  {object}  [opts]              - Options
 * @param  {integer} [opts.timeout=1000] - Search time (in ms) before failing
 * @param  {string}  [opts.udid]         - UDID of specific device to connect to
 * @return {Promise}
 * - resolves {net.Socket} - Tunneled connection to device
 * - rejects  {Error}
 *
 * @public
 */
export async function getTunnel(devicePort, opts: { timeout?: number, udid?: string }): Promise<net.Socket> {
  opts = opts || {};
  let udid: string;
  let deviceID: number;

  // If UDID was specified and that device's DeviceID is known, connect to it
  if (opts.udid && devices[opts.udid]) {
    deviceID = devices[opts.udid].DeviceID;
    return connect(deviceID, devicePort);
  }

  // If no UDID given, connect to any known device
  // (random because no key order, but there's probably only 1 option anyways)
  if (!opts.udid && Object.keys(devices).length) {
    udid = Object.keys(devices)[0];
    deviceID = devices[udid].DeviceID;
    return connect(deviceID, devicePort);
  }

  // - Try to find and connect to requested the device (given opts.UDID),
  // - or find and connect to any device (no opts.UDID given)
  return findDevice(opts).then(function(deviceID) {
    return connect(deviceID, devicePort);
  });
}
