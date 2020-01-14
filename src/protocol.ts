import * as plist from 'plist';

/**
 * Exposes methods for dealing with usbmuxd protocol messages (send/receive)
 *
 * The usbmuxd message protocol has 2 versions. V1 doesn't look like its used
 * anymore. V2 is a header + plist format like this:
 *
 * Header:
 *   UInt32LE Length  - is the length of the header + plist (16 + plist.length)
 *   UInt32LE Version - is 0 for binary version, 1 for plist version
 *   UInt32LE Request - is always 8, for plist? from rcg4u/iphonessh
 *   UInt32LE Tag     - is always 1, ? from rcg4u/iphonessh
 *
 * Plist:
 *   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 *     "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
 *   <plist version="1.0">
 *     <dict>
 *       <key>MessageType</key>
 *       <string>Listen</string>
 *       <key>ClientVersionString</key>
 *       <string>node-usbmux</string>
 *       <key>ProgName</key>
 *       <string>node-usbmux</string>
 *     </dict>
 *   </plist>
 *
 * References:
 * - https://github.com/rcg4u/iphonessh
 * - https://www.theiphonewiki.com/wiki/Usbmux (binary protocol)
 */
export const protocol = (function() {

  /**
   * Pack a request object into a buffer for usbmuxd
   *
   * @param  {object} payload_obj
   * @return {Buffer}
   */
  function pack(payload_obj) {
    var payload_plist = plist.build(payload_obj)
      , payload_buf = Buffer.from(payload_plist);

    var header = {
      len: payload_buf.length + 16,
      version: 1,
      request: 8,
      tag: 1
    };

    var header_buf = Buffer.alloc(16);
    header_buf.fill(0);
    header_buf.writeUInt32LE(header.len, 0);
    header_buf.writeUInt32LE(header.version, 4);
    header_buf.writeUInt32LE(header.request, 8);
    header_buf.writeUInt32LE(header.tag, 12);

    return Buffer.concat([header_buf, payload_buf]);
  }

  /**
   * Swap endianness of a 16bit value
   */
  function byteSwap16(val) {
    return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
  }

  /**
   * Listen request
   * @type {Buffer}
   */
  var listen = pack({
    MessageType:         'Listen',
    ClientVersionString: 'node-usbmux',
    ProgName:            'node-usbmux'
  });

  /**
   * Connect request
   *
   * Note: PortNumber must be network-endian, so it gets byte swapped here
   *
   * @param {integer} deviceID
   * @param {integer} port
   * @return {Buffer}
   */
  function connect(deviceID, port) {
    return pack({
      MessageType:         'Connect',
      ClientVersionString: 'node-usbmux',
      ProgName:            'node-usbmux',
      DeviceID:            deviceID,
      PortNumber:          byteSwap16(port)
    });
  }

  /**
   * Creates a function that will parse messages from data events
   *
   * net.Socket data events sometimes break up the incoming message across
   * multiple events, making it necessary to combine them. This parser function
   * assembles messages using the length given in the message header and calls
   * the onComplete callback as new messages are assembled. Sometime multiple
   * messages will be within a single data buffer too.
   *
   * @param  {makeParserCb} onComplete - Called as new msgs are assembled
   * @return {function}                - Parser function
   *
   * @callback makeParserCb
   * @param {object} - msg object converted from plist
   */
  function makeParser(onComplete) {
    // Store status (remaining message length & msg text) of partial messages
    // across multiple calls to the parse function
    var len, msg;

    /**
     * @param {Buffer} data - From a socket's data event
     */
    return function parse(data) {
      // Check if this data represents a new incoming message or is part of an
      // existing partially completed message
      if (!len) {
        // The length of the message's body is the total length (the first
        // UInt32LE in the header) minus the length of header itself (16)
        len = data.readUInt32LE(0) - 16;
        msg = '';

        // If there is data beyond the header then continue adding data to msg
        data = data.slice(16);
        if (!data.length) return;
      }

      // Add in data until our remaining length is used up
      var body = data.slice(0, len);
      msg += body;
      len -= body.length;

      // If msg is finished, convert plist to obj and run callback
      if (len === 0) onComplete(plist.parse(msg));

      // If there is any data left over that means there is another message
      // so we need to run this parse fct again using the rest of the data
      data = data.slice(body.length);
      if (data.length) parse(data);
    };
  }

  // Exposed methods
  return {
    listen: listen,
    connect: connect,
    makeParser: makeParser
  };
})();
