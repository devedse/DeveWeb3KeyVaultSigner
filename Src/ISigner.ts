import { Transaction } from 'ethereumjs-tx';

export interface ISigner {
    Sign(trans: Transaction): Promise<Transaction>;
    GetAddress(): Promise<string>;
    GetPublicKey(): Promise<Uint8Array>;
}