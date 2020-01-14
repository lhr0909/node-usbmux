/**
 * usbmuxd address
 *
 * OSX usbmuxd listens on a unix socket at /var/run/usbmuxd
 * Windows usbmuxd listens on port 27015
 *
 * libimobiledevice[1] looks like it operates at /var/run/usbmuxd too, but if
 * your usbmuxd is listening somewhere else you'll need to set this manually.
 *
 * [1] github.com/libimobiledevice/usbmuxd
 *
 * @public
 */
export const address =
  process.platform === 'win32' ? { port: 27015 } : { path: '/var/run/usbmuxd' };

// TODO: allow setting a different address for entire lib

// export const address = {
//   get: function() {
//     return addr;
//   },
//   set: function(newAddress) {
//     addr = newAddress;
//   },
// };
