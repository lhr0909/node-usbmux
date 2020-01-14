/// <reference types="node" />
import * as net from 'net';
export declare function connect(deviceID: number, devicePort: number): Promise<net.Socket>;
