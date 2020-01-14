/// <reference types="node" />
import * as net from 'net';
export declare function getTunnel(devicePort: any, opts: {
    timeout?: number;
    udid?: string;
}): Promise<net.Socket>;
