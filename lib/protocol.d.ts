/// <reference types="node" />
export declare const protocol: {
    listen: Buffer;
    connect: (deviceID: any, port: any) => Buffer;
    makeParser: (onComplete: any) => (data: any) => void;
};
