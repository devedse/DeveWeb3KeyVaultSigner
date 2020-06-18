import Web3 from 'web3';
import { TransactionConfig } from 'web3-core/types'

import * as fs from "fs";
import * as _ from 'underscore';


import { ClientSecretCredential } from "@azure/identity";

import { KeyvaultSigner } from './KeyvaultSigner';
import { PrivateKeySigner } from './PrivateKeySigner';

import AccountsSignerv2 from './AccountsSignerv2';

export default class NewSignerTester {
    

    public static async start() {
        const web3Provider = new Web3.providers.HttpProvider('https://******.blockchain.azure.com:3200/******');
        const web3 = new Web3(web3Provider);


        const contractAddress = "0x453cFd86f7e4E27F39EBe71D5745a0dd9A0381b1";

        const credential = new ClientSecretCredential("b16f4369-54ea-4588-b67b-6b4e88aad386", "5dea3774-506e-4147-afe7-28bf0b366ca3", "******************");

        const vaultName = "devekeysigntest";
        const url = `https://${vaultName}.vault.azure.net`;


        const abiFileData = fs.readFileSync("Contracts/CoolContract.abi").toString();
        let abi = JSON.parse(abiFileData);


        var myContract = new web3.eth.Contract(abi, contractAddress, {
            gasPrice: '20000000000' // default gas price in wei, 20 gwei in this case
        });
        
        //0xeD51E3a977df922f7ca737453159355d9a97f8Fe
        let signer = new KeyvaultSigner(url, "testkey", credential);

        //0xDADc73c25FDb47f585b19cE8216d3Dc1af267940
        //let signer = new PrivateKeySigner("164f95b74fe8957700bfd025a9be2dea0bc16c64b6c6e5737c544f361985ad02");

        const accountAddress = await signer.GetAddress();


        
        for (let i = 0; i < 10; i++) {
            const encoded = myContract.methods.setData(`supercool${i}`).encodeABI()


            var tx: TransactionConfig = 
            {
                to : contractAddress,
                data : encoded,
                gas: 1000000,
                gasPrice: 0,
                //nonce: nonce,
                //chainId: 2153,
                from: accountAddress
            };

            //Original code
            //const signed2 = await web3.eth.accounts.signTransaction(tx, privateKey);

            //Calling my code
            const signed = await AccountsSignerv2.signTransaction(web3, tx, signer);

            const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction!);

            console.log(receipt);
        }
    }







   
}
