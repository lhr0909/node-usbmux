/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class Relay extends EventEmitter {
    private _devicePort;
    private _relayPort;
    private _udid;
    private _listener;
    private _server;
    constructor(devicePort: number, relayPort: number, opts: {
        timeout?: number;
        udid: string;
    });
    stop(): void;
    private _emit;
    private _startListener;
    private _startServer;
    private _handler;
}
