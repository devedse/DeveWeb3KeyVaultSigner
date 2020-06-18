import Web3 from 'web3';
import { TransactionConfig } from 'web3-core/types'
import helpers from 'web3-core-helpers'
import utils from 'web3-utils'
import Common from 'ethereumjs-common';
import { Transaction } from 'ethereumjs-tx';

import * as _ from 'underscore';

import Helpers from './Helpers';

import { ISigner } from './ISigner';

import { TransactionOptions } from 'ethereumjs-tx';

export default class AccountsSignerv2 {

    public static async signTransaction(web3: Web3, tx: TransactionConfig, signer: ISigner) {
        const hasTxSigningOptions = !!(tx && ((tx.chain && tx.hardfork) || tx.common));
    
    
        if (!tx) {
            throw new Error('No transaction object given!');
        }
    
        
    
    
        // Resolve immediately if nonce, chainId, price and signing options are provided
        if (tx.nonce !== undefined && tx.chainId !== undefined && tx.gasPrice !== undefined && hasTxSigningOptions) {
            return AccountsSignerv2.signed(tx, signer);
        }

        const accountAddress = await signer.GetAddress();
    
        // Otherwise, get the missing info from the Ethereum Node
        return Promise.all([
            Helpers.isNot(tx.chainId) ? web3.eth.getChainId() : tx.chainId,
            Helpers.isNot(tx.gasPrice) ? web3.eth.getGasPrice() : tx.gasPrice,
            Helpers.isNot(tx.nonce) ? web3.eth.getTransactionCount(accountAddress) : tx.nonce,
            Helpers.isNot(hasTxSigningOptions) ? web3.eth.net.getId() : 1
        ]).then(function(args) {
            if (Helpers.isNot(args[0]) || Helpers.isNot(args[1]) || Helpers.isNot(args[2]) || Helpers.isNot(args[3])) {
                throw new Error('One of the values "chainId", "networkId", "gasPrice", or "nonce" couldn\'t be fetched: ' + JSON.stringify(args));
            }
            return AccountsSignerv2.signed(_.extend(tx, {chainId: args[0], gasPrice: args[1], nonce: args[2], networkId: args[3]}), signer);
        });
    }

    public static async signed(tx: TransactionConfig, signer: ISigner) : Promise<any> {
        let transactionOptions: TransactionOptions = { 
        };


        let hasTxSigningOptions = !!(tx && ((tx.chain && tx.hardfork) || tx.common));

        if (tx.common && (tx.chain && tx.hardfork)) {
            throw new Error(
                'Please provide the ethereumjs-common object or the chain and hardfork property but not all together.'
            );
        }

        if ((tx.chain && !tx.hardfork) || (tx.hardfork && !tx.chain)) {
            throw new Error(
                'When specifying chain and hardfork, both values must be defined. ' +
                'Received "chain": ' + tx.chain + ', "hardfork": ' + tx.hardfork
            );
        }

        if (!tx.gas) {
            throw new Error('"gas" is missing');
        }

        if (tx.nonce! < 0 ||
            tx.gas! < 0 ||
            tx.gasPrice! < 0 ||
            tx.chainId! < 0) {
            throw new Error('Gas, gasPrice, nonce or chainId is lower than 0');
        }

        var transaction = helpers.formatters.inputCallFormatter(_.clone(tx));
        transaction.to = transaction.to || '0x';
        transaction.data = transaction.data || '0x';
        transaction.value = transaction.value || '0x';
        transaction.chainId = utils.numberToHex(transaction.chainId);

        // Because tx has no ethereumjs-tx signing options we use fetched vals.
        if (!hasTxSigningOptions) {
            transactionOptions.common = Common.forCustomChain(
                'mainnet',
                {
                    name: 'custom-network',
                    networkId: transaction.networkId,
                    chainId: transaction.chainId
                },
                'petersburg'
            );

            delete transaction.networkId;
        } else {
            if (transaction.common) {
                transactionOptions.common = Common.forCustomChain(
                    transaction.common.baseChain || 'mainnet',
                    {
                        name: transaction.common.customChain.name || 'custom-network',
                        networkId: transaction.common.customChain.networkId,
                        chainId: transaction.common.customChain.chainId
                    },
                    transaction.common.hardfork || 'petersburg'
                );

                delete transaction.common;
            }

            if (transaction.chain) {
                transactionOptions.chain = transaction.chain;
                delete transaction.chain;
            }

            if (transaction.hardfork) {
                transactionOptions.hardfork = transaction.hardfork;
                delete transaction.hardfork;
            }
        }

        var ethTx = new Transaction(transaction, transactionOptions);

        await signer.Sign(ethTx);


        var validationResult = ethTx.validate(true);

        if (validationResult !== '') {
            throw new Error('Signer Error: ' + validationResult);
        }

        var rlpEncoded = ethTx.serialize().toString('hex');
        var rawTransaction = '0x' + rlpEncoded;
        var transactionHash = utils.keccak256(rawTransaction);

        var result = {
            messageHash: '0x' + Buffer.from(ethTx.hash(false)).toString('hex'),
            v: '0x' + Buffer.from(ethTx.v).toString('hex'),
            r: '0x' + Buffer.from(ethTx.r).toString('hex'),
            s: '0x' + Buffer.from(ethTx.s).toString('hex'),
            rawTransaction: rawTransaction,
            transactionHash: transactionHash
        };

        return result;
    }
}