// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Try.sol";

contract TryFactory {

    Try public lottery;
    address KittyNFT; 
    address owner;

    event LotteryCreated();

    constructor(){
        owner = msg.sender;
    }

    function createNewLottery(uint _M, uint _K, address _owner) public {
        require(msg.sender == owner);
        lottery = new Try(_M, _K, KittyNFT, _owner);
        emit LotteryCreated();
    }

    function getLottteryAddr() public view returns(Try){
        return lottery;
    }

    function setKittyNFTAddress(address addr) public {
        require(msg.sender == owner);
        KittyNFT = addr;
    }

}