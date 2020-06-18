
import { ISigner } from './ISigner';
import { Transaction } from 'ethereumjs-tx';
import Helpers from './Helpers';

import * as ethereumjsutil from 'ethereumjs-util';

export class PrivateKeySigner implements ISigner {
    privateKey: string;

    constructor(privateKey: string) {
        if (!privateKey.startsWith('0x'))
        {
            privateKey = '0x' + privateKey;
        }
        this.privateKey = privateKey;
    }

    Sign(trans: Transaction): Promise<Transaction> {
        const slicesPrivateKey = Buffer.from(this.privateKey.slice(2), 'hex');
        trans.sign(slicesPrivateKey)
        return Promise.resolve(trans);
    }

    async GetAddress(): Promise<string> {
        const publicKey = await this.GetPublicKey();
        return Helpers.PublicKeyToAddress(publicKey);
    }

    async GetPublicKey(): Promise<Uint8Array> {
        const privateKeyBuffer = ethereumjsutil.toBuffer(this.privateKey);
        const result =  ethereumjsutil.privateToPublic(privateKeyBuffer);

        var publicKey = new Uint8Array(1 + result.length);
        publicKey[0] = 0x04;
        publicKey.set(result, 1);
        return Promise.resolve(publicKey);
    }
}