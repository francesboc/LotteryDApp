// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./KittyNFT.sol";

/**
 * @title Try
 * @dev A lottory of NFT
 */

// A representation of a ticket in lottery
struct Ticket{
    address buyer;
    uint[6] numbers;
    uint matches;
    uint powerballNum;
    bool powerballMatch;
    bool isWinning;
}

contract Try {

    // Fixed round duration
    uint public M;
    uint public constant ticketPrice = 1 gwei;
    // K parameter chosen by operator
    uint public K;
    uint public blockNumber;
    // End of a round
    uint public roundDuration;
    // The drawn numbers 
    uint[6] public winningNumbers;

    bool public isContractActive;
    bool public isRoundActive;
    bool public isPrizeGiven;

    address public owner;

    KittyNFT nft;
    Ticket[] public tickets; 

    event TicketBought(string result, address _addr, uint[6] _numbers);
    event NFTWin(address _addr, uint _class);
    event ToLog(string str);
    event NewWinningNumber(uint number);

    constructor(uint _M, uint _K) {
        M = _M;
        K = _K;
        isRoundActive = false;
        isContractActive = true;
        isPrizeGiven = true;
        owner = msg.sender;
        uint i=0;
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
        string memory log = string(abi.encodePacked("A new round has started. Current block:", Strings.toString(blockNumber), 
            " Final block:", Strings.toString(roundDuration)));
        emit ToLog(log);
    }

    /**
     * @dev Let users buy a ticket
     * @param numbers: the numbers picked by the user
     * @return bool: True in case of successful purchase, False o.w
     */
    function buy(uint[6] memory numbers) public payable returns(bool) {
        require(isContractActive,"Lottery is closed.");
        require(isRoundActive, "Round is closed. Try later.");
        require(block.number <= roundDuration, "You can buy a ticket when a new round starts.");
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
                picked[numbers[i]-1] = true;
            }
            else
                require(numbers[i] >= 1 && numbers[i] <= 26, "Powerball number must be in range [1,26]");
        }
        // Ticket can be bought, All checks passed
        tickets.push(Ticket(msg.sender, numbers, 0, numbers[5], false,false));

        emit TicketBought("Ticket successfully purchased", msg.sender, numbers);
        uint change = msg.value - 1 gwei;
        if( change != 0){
            payable(msg.sender).transfer(change);
            emit ToLog("Change issued");
        }
        return true;
    }

    /**
     * @dev Pick random numbers as winning numbers for this round.
            Then it assign the rewards to winning users, if any.
     * @return bool: True in case of successful purchase, False o.w
     */
    function drawNumbers() public returns(bool){
        require(isContractActive,"Lottery is closed.");
        require(msg.sender==owner, "Only the owner can draw numbers.");
        // Considering that a block is mined every 12 seconds on average, 
        // waiting other 25 means waiting other 5 minutes to draw numebrs.
        require(block.number >= roundDuration + K + 25, "Too early to draw numbers");
        require(!isPrizeGiven, "Already drawn winning numbers.");
        isRoundActive = false;
        uint i;
        bool[69] memory picked;
        for (i=0; i<69; i++)
            picked[i] = false; 
        uint extractedNumber;
        bytes32 bhash = keccak256(abi.encodePacked(block.difficulty, block.timestamp, roundDuration + K));
        bytes memory bytesArray = new bytes(32);
        bytes32 rand;
        for (uint j=0; j<5; j++){
            for (i=0; i <32; i++)
                bytesArray[i] = bhash[i];
            rand = keccak256(bytesArray);
            // generate random
            extractedNumber = (uint(rand) % 69) + 1;
            if(!picked[extractedNumber-1]){
                // Not already extracted, this is a winning number
                winningNumbers[j] = extractedNumber;
                picked[extractedNumber-1] = true;
                emit NewWinningNumber(extractedNumber);
            }
            else{
                // number already extracted. Retry.
                j -= 1;
            }
            bhash = bhash ^ rand;
        }
        // Gold number
        winningNumbers[5] = (uint(rand) % 26) + 1;
        emit ToLog("Winning numbers extracted");
        // Give the awards to users
        givePrizes();
        
        return true;
    }   

    /**
     * @dev Assign prizes to users.
     */
    function givePrizes() public payable {
        require(isContractActive,"Lottery is closed.");
        require(msg.sender==owner, "Only the owner can draw numbers.");
        require(!isRoundActive, "Round still in progress.");
        require(!isPrizeGiven, "Already given prizes.");
        uint powerBall = winningNumbers[5];
        uint[6] memory userNumbers;
        uint i;
        // select winners
        for(i=0; i < tickets.length; i++){
            userNumbers = tickets[i].numbers;
            for (uint j=0; j < 5; j++){
                for(uint k=0; k < 5; k++){
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
                emit NFTWin(tickets[i].buyer, winNFTClass);
                uint tokenId = nft.getTokenFromClass(winNFTClass);
                nft.awardItem(tickets[i].buyer, tokenId);
                mint(winNFTClass);
            }
        }
        isPrizeGiven = true;

        payable(owner).transfer(address(this).balance);

        delete tickets;
    }

    /**
     * @dev Used to mint a new NFT of a specific class
     * @param _class: NFT's class to be mined
     */
    function mint(uint _class) public {
        require(isContractActive,"Lottery is closed.");
        nft.mint(_class);
        string memory log = string(abi.encodePacked("Minted new NFT of class ", Strings.toString(_class)));
        emit ToLog(log);
    }
    
    /**
     * @dev Close the lottery, deactivating the contract.
            If a round is active, it refund users.
     */
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

        emit ToLog("Lottery closed");
    }
}