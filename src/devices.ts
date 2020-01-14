import { DeviceProperties } from './types/DeviceProperties';

/**
 * Keep track of connected devices
 *
 * Maps device UDID to device properties, ie:
 * '22226dd59aaac687f555f8521f8ffddac32d394b': {
 *   ConnectionType: 'USB',
 *   DeviceID: 19,
 *   LocationID: 0,
 *   ProductID: 4776,
 *   SerialNumber: '22226dd59aaac687f555f8521f8ffddac32d394b'
 * }
 *
 * Devices are added and removed to this obj only by createListener()
 *
 * @public
 */
export const devices: { [key: string]: DeviceProperties } = {};
