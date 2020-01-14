import { devices } from './devices';
import { createListener } from './listener';

/**
 * Find a device (specified or not) within a timeout
 *
 * Usbmuxd has IDs it assigned to devices as they are plugged in. The IDs
 * change as devices are unpplugged and plugged back in, so even if we have a
 * UDID we need to get the current ID from usbmuxd before we can connect.
 *
 * @param  {object}  [opts]              - Options
 * @param  {integer} [opts.timeout=1000] - Search time (in ms) before failing
 * @param  {string}  [opts.udid]         - UDID of a specific device to find
 * @return {Q.promise}
 * - resolves {integer} - DeviceID from usbmuxd needed for a connect request
 * - rejects  {Error}
 */
export async function findDevice(opts: { timeout?: number, udid?: string }): Promise<number> {
  return new Promise((resolve, reject) => {
    const listener = createListener();
    opts = opts || {};

    const timer = setTimeout(function() {
      listener.end();
      (opts.udid)
        ? reject(new Error('Requested device not connected'))
        : reject(new Error('No devices connected'));
    }, opts.timeout || 1000);

    listener.on('attached', function(udid) {
      if (opts.udid && opts.udid !== udid) return;
      listener.end();
      clearTimeout(timer);
      resolve(devices[udid].DeviceID);
    });
  });
}
