// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./KittyNFT.sol";

/**
 * @title Try
 * @dev A lottory of NFT
 */
contract Try {

    uint public constant M = 100;
    uint public constant ticketPrice = 1 gwei;

    bool public isRoundActive;
    uint public blockNumber;
    uint public roundDuration;
    address public owner;
    KittyNFT nft;

    // To iterate over the mapping
    address[] public buyers;
    mapping (address => uint[]) tickets;

    // Associate tokenID with NFT
    mapping (uint => KittyNFT) collectibles;
    // Associate each collectible's tokenID to a rank
    mapping (uint => uint) classes;
    // To iterate over the NFTs
    uint[] public tokenIDs;
    // The drawn numbers 
    uint[] public winningNumbers;

    event TicketBought();

    constructor() {
        owner = msg.sender;
        isRoundActive = false;
        uint i=0;
        uint tokenId;
        nft = new KittyNFT();
        // Generation of first eight NFT
        for (i=0; i<8; i++){
            tokenId = nft.mint();
            collectibles[tokenId] = nft;
            classes[tokenId] = i+1;
            tokenIDs.push(tokenId);
        }
    }

    /**
     * @dev Start a new round of the lottery
     */
    function startNewRound() public {
        require(msg.sender==owner, "Only the owner can start a new round.");
        require(!isRoundActive, "A new round can start after the previous expires.");
        isRoundActive = true;
        blockNumber = block.number;
        roundDuration = blockNumber + M;
    }

    /**
     * @dev Let user buy a ticket
     * @param numbers the numbers picked by the user
     * @return True in case of successful purchase, False o.w
     */
    function buy(uint[] memory numbers) public payable returns(bool) {
        require(isRoundActive, "Round is closed. Try later.");
        require(block.number < roundDuration, "You can buy a ticket when a new round starts.");
        require(msg.value >= ticketPrice, "1 gwei is required to buy a ticket.");
        uint numebrsLen = numbers.length;
        require(numebrsLen == 6, "You have to pick 5 numbers and a powerball number");
        uint i;
        for(i=0; i< numebrsLen; i++){
            if(i != 5){
                require(numbers[i] >= 1 && numbers[i] <= 69);
                require(isNumberNotAlreadyPicked(numbers[i], numbers, i),"Ticket numbers cannot be duplicated");
            }
            else
                require(numbers[i] >= 1 && numbers[i] <= 26);
        }
        // Ticket can be bought, All checks passed
        tickets[msg.sender] = numbers;
        buyers.push(msg.sender);

        emit TicketBought();
        uint change = msg.value - 1 gwei;
        if( change != 0){
            payable(msg.sender).transfer(change);
        }

        return true;
    }

    function isNumberNotAlreadyPicked(uint num, uint[] memory numbers, uint index) private pure returns (bool){
        uint i;
        for (i=0; i<numbers.length; i++){
            if(i != index){
                if(numbers[i] == num)
                    return false;
            }
        }
        return true;
    } 

    function drawNumbers(uint K) public returns(uint[] memory){
        require(msg.sender==owner, "Only the owner can draw numbers.");
        // Considering that a block is mined every 12 seconds on average, 
        // waiting other 25 means waiting other 5 minutes to draw numebrs.
        require(block.number >= roundDuration + 25, "Too early to draw numbers");

        bytes32 bhash = blockhash(roundDuration + K);
        bytes memory bytesArray = new bytes(32);
        for (uint i; i <32; i++){
            bytesArray[i] =bhash[i];
        }
        bytes32 rand=keccak256(bytesArray);
        for (uint i=0; i<5; i++){
            winningNumbers[i] = (uint(rand) % 69) + 1;
        }
        // Gold number
        winningNumbers[5] = (uint(rand) % 26) + 1;
        return winningNumbers;
    }   
}