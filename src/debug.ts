/**
 * Debugging
 * set with DEBUG=usbmux:* env variable
 *
 * on windows cmd set with: cmd /C "SET DEBUG=usbmux:* && node script.js"
 */
import { debug as bug } from 'debug';

export const debug = {
  relay: bug('usbmux:relay'),
  listen: bug('usbmux:listen'),
  connect: bug('usbmux:connect'),
};
