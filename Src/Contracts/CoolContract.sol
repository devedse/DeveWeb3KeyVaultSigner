/**
 * @title this smart contract contains the basic functions to initialise inventory and get all items from it
 *
 * @dev this contract needs to be updated with function modifiers to enable access control.
 *
 * @notice this contract will be deployed as public.
 */

pragma solidity >=0.6.0 <0.7.0;


contract CoolContract {

    string public testData;
    address public lastSender;
    uint public lastBlock;
    uint public contractCalls;

    constructor() public {
    }

    function getData() public view returns (string memory data) {
        return testData;
    }

    function setData(string memory data) public {
        testData = data;
        lastSender = msg.sender;
        lastBlock = block.number;
        contractCalls++;
    }
}