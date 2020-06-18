import jssha3 from 'js-sha3';

export default class Helpers {
    public static byteToHexString(arr: Uint8Array) : string {
        if (!arr) {
            return '';
        }
        
        var hexStr = '';
        for (var i = 0; i < arr.length; i++) {
            var hex = (arr[i] & 0xff).toString(16);
            hex = (hex.length === 1) ? '0' + hex : hex;
            hexStr += hex;
        }
        
        return hexStr;
    }

    public static parseHexString(str: string) : Uint8Array {
        if (!str) {
            return new Uint8Array();
        }
          
        var a = [];
        for (var i = 0, len = str.length; i < len; i+=2) {
            a.push(parseInt(str.substr(i,2),16));
        }
          
        return new Uint8Array(a);
    }

    public static ConvertToChecksumAddress(address: string) : string
    {
        address = address.toLowerCase();
        if (address.startsWith("0x")) {
            address = address.slice(2);
        }
        var addressHash = jssha3.keccak256(address);
        var checksumAddress = "0x";

        for (var i = 0; i < address.length; i++)
            if (parseInt(addressHash[i].toString(), 16) > 7)
                checksumAddress += address[i].toString().toUpperCase();
            else
                checksumAddress += address[i];
        return checksumAddress;
    }

    public static PublicKeyToAddress(publicKeyWith0xPrefix: Uint8Array) : string
    {
        const pubKeyNoPrefix = publicKeyWith0xPrefix.slice(1);
        const kec = jssha3.keccak256(pubKeyNoPrefix);
        const address = kec.slice(24);

        const checksumAddress = Helpers.ConvertToChecksumAddress(address);

        return checksumAddress;
    }

    public static ArrayEqual(buf1: Uint8Array, buf2: Uint8Array) : boolean
    {
        if (buf1.byteLength != buf2.byteLength) return false;
        if (buf1.length != buf2.length) return false;
        for (var i = 0 ; i != buf1.length ; i++)
        {
            if (buf1[i] != buf2[i]) {
                return false;
            }
        }
        return true;
    }

    public static isNot(value: any) : boolean {
        return (value == undefined || value == null);
    }
}