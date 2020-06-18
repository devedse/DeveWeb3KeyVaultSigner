
import { ISigner } from './ISigner';
import Helpers from './Helpers';

import { KeyClient, CryptographyClient, KeyVaultKey } from "@azure/keyvault-keys";
import { TokenCredential } from "@azure/identity";

import { Transaction } from 'ethereumjs-tx';

import BN from 'bn.js';

export class KeyvaultSigner implements ISigner {
    keyClient: KeyClient;
    cryptoClient: CryptographyClient | null = null;
    credentials: TokenCredential;

    keyName: string;
    key: KeyVaultKey | null = null;
    

    constructor(keyvaultUrl: string, keyName: string, credentials: TokenCredential) {
        this.keyClient = new KeyClient(keyvaultUrl, credentials);
        this.credentials = credentials;
        this.keyName = keyName;
    }

    async Sign(trans: Transaction): Promise<Transaction> {    
        const publicKeySliced = (await this.GetPublicKey()).slice(1);

        if (this.cryptoClient == null) {
            if (this.key == null) {
                throw new Error("Key is null");
            }
            this.cryptoClient = new CryptographyClient(this.key?.id!, this.credentials);
        }

        const rawHash = trans.hash(false);
        const signAlgorithm: any = "ECDSA256";
        let signature = await this.cryptoClient.sign(signAlgorithm, rawHash);

        for (let recovery = 0; recovery < 4; recovery++) {
            var ret = {
                r: signature.result.slice(0, 32),
                s: signature.result.slice(32, 64),
                v: 0
            };

            var SECP256K1_N_DIV_2 = new BN('7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0', 16);
            var SECP256K1_N = new BN('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 16);

            if (new BN(ret.s).cmp(SECP256K1_N_DIV_2) === 1) {
                const bns = new BN(ret.s);
                const subtracted = SECP256K1_N.sub(bns);
                const arrayified = subtracted.toArray();
                const result = new Uint8Array(arrayified);
                ret.s.set(result);
            }

            try {
                ret.v = trans.getChainId() ? recovery + (trans.getChainId() * 2 + 35) : recovery + 27
                Object.assign(trans, ret);
                var validationResult = trans.validate(true);

                const extractedPublicKey = trans.getSenderPublicKey();
                if (validationResult === '') {
                    if (Helpers.ArrayEqual(extractedPublicKey, publicKeySliced))
                    {
                        break;
                    }
                }
            } catch (ex) {
                console.log(ex);
            }
        }

        return trans;
    }

    async GetAddress(): Promise<string> {
        const publicKey = await this.GetPublicKey();
        return Helpers.PublicKeyToAddress(publicKey);
    }

    async GetPublicKey(): Promise<Uint8Array> {
        if (this.key == null) {
            this.key = await this.keyClient.getKey(this.keyName);
        }

        var xLen = this.key.key?.x?.length;
        var yLen =  this.key.key?.y?.length;
        var publicKey = new Uint8Array(1 + xLen! + yLen!);
        publicKey[0] = 0x04;
        var offset = 1;
        publicKey.set(this.key.key?.x!, offset);
        offset = offset + xLen!;
        publicKey.set(this.key.key?.y!, offset);

        return publicKey;
    }
}