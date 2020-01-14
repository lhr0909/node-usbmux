/**
 * Custom usbmuxd error
 *
 * There's no documentation for usbmuxd responses, but I think I've figured
 * out these result numbers:
 * 0 - Success
 * 2 - Device requested isn't connected
 * 3 - Port requested isn't available \ open
 * 5 - Malformed request
 *
 * @param {string}  message  - Error message
 * @param {integer} [number] - Error number given from usbmuxd response
 */
export class UsbmuxdError extends Error {
  public name;
  public number;

  constructor(message: string, number: number) {
    super(message);
    this.name = 'UsbmuxdError';

    if (number) {
      this.number = number;
      this.message += ', Err #' + number;
    }

    if (number === 2) this.message += ": Device isn't connected";
    if (number === 3) this.message += ": Port isn't available or open";
    if (number === 5) this.message += ': Malformed request';
  }
}
