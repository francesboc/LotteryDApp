// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./KittyNFT.sol";

/**
 * @title Try
 * @dev A lottory of NFT
 */

struct Ticket{
    address buyer;
    uint[] numbers;
    uint matches;
    uint powerballNum;
    bool powerballMatch;
    bool isWinning;
}

contract Try {

    uint public constant M = 100;
    uint public constant ticketPrice = 1 gwei;
    uint public K;
    uint public blockNumber;
    uint public roundDuration;
    // The drawn numbers 
    uint[] public winningNumbers;

    bool public isContractActive;
    bool public isRoundActive;
    bool public isPrizeGiven;

    address public owner;
    
    // Associate tokenID with NFT
    mapping (uint => KittyNFT) collectibles;

    KittyNFT nft;
    Ticket[] public tickets; 

    event TicketBought();

    constructor(uint _K) {
        K = _K;
        isRoundActive = false;
        isContractActive = true;
        isPrizeGiven = true;
        owner = msg.sender;
        uint i=0;
        //uint tokenId;
        nft = new KittyNFT(owner);
        // Generation of first eight NFT
        for (i=0; i<8; i++)
            nft.mint(i+1);
    }

    /**
     * @dev Start a new round of the lottery
     */
    function startNewRound() public {
        require(isContractActive,"Lottery is closed.");
        require(msg.sender==owner, "Only the owner can start a new round.");
        require(!isRoundActive, "A new round can start after the previous expires.");
        require(isPrizeGiven, "Wait for prizes before start a new round.");
        isRoundActive = true;
        isPrizeGiven = false;
        blockNumber = block.number;
        roundDuration = blockNumber + M;
    }

    /**
     * @dev Let user buy a ticket
     * @param numbers the numbers picked by the user
     * @return True in case of successful purchase, False o.w
     */
    function buy(uint[] memory numbers) public payable returns(bool) {
        require(isContractActive,"Lottery is closed.");
        require(isRoundActive, "Round is closed. Try later.");
        require(block.number < roundDuration, "You can buy a ticket when a new round starts.");
        require(msg.value >= ticketPrice, "1 gwei is required to buy a ticket.");
        uint numebrsLen = numbers.length;
        require(numebrsLen == 6, "You have to pick 5 numbers and a powerball number");
        uint i;
        bool[69] memory picked;
        for (i=0; i<69; i++)
            picked[i] = false; 

        for(i=0; i< numebrsLen; i++){
            if(i != 5){
                require(numbers[i] >= 1 && numbers[i] <= 69);
                require(!picked[numbers[i]-1], "Ticket numbers cannot be duplicated");
                // require(isNumberNotAlreadyPicked(numbers[i], numbers,numbers.length, i),"Ticket numbers cannot be duplicated");
                picked[numbers[i]-1] = true;
            }
            else
                require(numbers[i] >= 1 && numbers[i] <= 26);
        }
        // Ticket can be bought, All checks passed
        tickets.push(Ticket(msg.sender, numbers, 0, numbers[5], false,false));

        emit TicketBought();
        uint change = msg.value - 1 gwei;
        if( change != 0)
            payable(msg.sender).transfer(change);
        return true;
    }

    // function isNumberNotAlreadyPicked(uint num, 
    //     uint[] memory numbers,
    //     uint len, 
    //     uint index) private pure returns (bool){
    //     uint i;
    //     for (i=0; i<len; i++){
    //         if(i != index){
    //             if(numbers[i] == num)
    //                 return false;
    //         }
    //     }
    //     return true;
    // } 

    function drawNumbers() public returns(uint[] memory){
        require(isContractActive,"Lottery is closed.");
        require(msg.sender==owner, "Only the owner can draw numbers.");
        // Considering that a block is mined every 12 seconds on average, 
        // waiting other 25 means waiting other 5 minutes to draw numebrs.
        require(block.number >= roundDuration + 25, "Too early to draw numbers");
        require(!isPrizeGiven, "Already drawn winning numbers.");
        isRoundActive = false;
        uint i;
        bool[69] memory picked;
        for (i=0; i<69; i++)
            picked[i] = false; 
        uint extractedNumber;
        bytes32 bhash = blockhash(roundDuration + K);
        bytes memory bytesArray = new bytes(32);
        for (i=0; i <32; i++){
            bytesArray[i] =bhash[i];
        }
        bytes32 rand=keccak256(bytesArray);

        for (i=0; i<5; i++){
            extractedNumber = (uint(rand) % 69) + 1;
            if(!picked[extractedNumber]){
                // Not already extracted, this is a winning number
                winningNumbers[i] = extractedNumber;
                picked[extractedNumber] = true;
            }
            else
                // number already extracted. Retry.
                i -= 1;
        }
        // Gold number
        winningNumbers[5] = (uint(rand) % 26) + 1;
        // Give the awards to users
        givePrizes();
        return winningNumbers;
    }   

    function givePrizes() public {
        require(isContractActive,"Lottery is closed.");
        require(msg.sender==owner, "Only the owner can draw numbers.");
        require(isPrizeGiven, "Already given prizes.");
        uint powerBall = winningNumbers[5];
        uint[] memory userNumbers;
        uint i;
        // select winners
        for(i=0; i < tickets.length; i++){
            userNumbers = tickets[i].numbers;
            for (uint j=0; j < winningNumbers.length; i++){
                for(uint k=0; k < userNumbers.length; k++){
                    if(userNumbers[k] == winningNumbers[j]){
                        tickets[i].matches += 1;
                        tickets[i].isWinning = true;
                        break;
                    }
                }
            }
            if(tickets[i].powerballNum == powerBall){
                tickets[i].powerballMatch = true;
                tickets[i].isWinning = true;
            }
        }
        uint matches;
        // assign prizes based on matches
        uint winNFTClass;
        for (i=0; i< tickets.length; i++){
            if(tickets[i].isWinning){
                winNFTClass = 9;
                matches =  tickets[i].matches;
                if(matches == 1){
                    winNFTClass = 7;
                } else if (matches == 2){
                    winNFTClass = 6;
                } else if (matches == 3){
                    winNFTClass = 5;
                } else if (matches == 4){
                    winNFTClass = 4;
                } else if (matches == 5){
                    winNFTClass = 2;
                }
                if (tickets[i].powerballMatch)
                    winNFTClass-=1;
                // here we have to assign NFT to the address
                uint tokenId = nft.getTokenFromClass(winNFTClass);
                nft.awardItem(tickets[i].buyer, tokenId);
                mint(winNFTClass);
            }
        }
        isPrizeGiven = true;

        payable(owner).transfer(address(this).balance);

        delete tickets;
    }

    function mint(uint _class) public {
        require(isContractActive,"Lottery is closed.");
        // It mint new collectibles
        nft.mint(_class);
    }
    
    function closeLottery() public payable {
        require(isContractActive,"Lottery is already closed.");
        require(msg.sender==owner, "Only the owner can close the lottery.");
        isContractActive = false;

        address payable userAddress;
        if(isRoundActive && !isPrizeGiven){
            // Need to refund players
            for(uint i=0; i < tickets.length; i++){
                userAddress = payable(tickets[i].buyer);
                userAddress.transfer(ticketPrice);
            }
        }
        
    }
}