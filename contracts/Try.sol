// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./KittyNFT.sol";

contract Try {

    bool public isRoundActive;
    uint public blockNumber;
    uint public roundDuration;
    address public owner;
    KittyNFT nft;

    // To iterate over the mapping
    address[] public buyers;
    mapping (address => uint[]) tickets;

    mapping (uint => KittyNFT) collectibles;
    // Fungible Token for each collectible, and defines the value rank of that
    // collectible. The operator may mint further NFTs during the lottery, if needed. To
    // simplify the implementation, the NFT may contain a description of the
    // collectible’s image (or the NFT may store the image itself or the URL of the
    // image, if an image repository is available).
    constructor() {
        owner = msg.sender;
        isRoundActive = false;
        nft = new KittyNFT();
    }

    function startNewRound(uint duration) public {
        require(msg.sender==owner, "Only the owner can start a new round.");
        require(!isRoundActive, "A new round can start after the previous expires.");
        isRoundActive = true;
        blockNumber = block.number;
        roundDuration = duration;

        // Generation of NFT
        for (i=0; i<8; i++){
            
        }
    }

}