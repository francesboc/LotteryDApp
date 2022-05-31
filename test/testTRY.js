const { expect } = require("chai");
const { should } = require("chai");
const { assert } = require("chai");

function generateRandom(){
    let rand = [];

    for (let i = 0; i < 5; i++) {
        let elem = Math.floor((Math.random() * 69)+1);
        if (!rand.includes(elem)) {
            rand.push(elem);
        }
        else{
            i = i-1;
        }
    }

    rand.push(Math.floor((Math.random() * 26)+1));
    return rand;
}

describe("Lottery test", function(){
    it("should be a test of a round of the lottery", async function () {
        const artifactsPath = `contracts/artifacts/Try.json` // Change this for different path
        const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath))
        const accounts = await web3.eth.getAccounts()

        let contract = new web3.eth.Contract(metadata.abi)
        let failReason = null;
        let _k = 1 // K parameter
        let _m = 5 // round duration 
        contract = contract.deploy({
            data: metadata.data.bytecode.object,
            arguments: [_m,_k] 
        })

        // Instantiating contract
        try_contract = await contract.send({
            from: accounts[0],
            gas: 15000000000,
            gasPrice: '30000000000'
        })
        
        let isRoundActive =  await try_contract.methods.isRoundActive().call()
        let isPrizeGiven = await try_contract.methods.isPrizeGiven().call()

        assert.equal(isRoundActive, false, "The round should be active")
        assert.equal(isPrizeGiven, true, "The round should be active")

        // Start a new round
        await try_contract.methods.startNewRound().send({
            from: accounts[0],
            gas: 15000000000,
            gasPrice: '30000000000'
        })

        let roundDuration = await try_contract.methods.roundDuration().call()
        console.log("This round will end at block: " + roundDuration)

        let block_number = await web3.eth.getBlockNumber()
        let buyer = []
        let buyersNumbers = []
        // Buy some tickets
        try{
            for (let i = 0; i < _m; i++) {
                let result = await try_contract.methods.buy(generateRandom()).send({
                    from: accounts[Math.floor((Math.random() * 10)+1)],
                    gas: 15000000000,
                    gasPrice: '30000000000',
                    value: web3.utils.toWei("1", "gwei")
                })
                buyer.push(result.events.TicketBought.returnValues._addr)
                buyersNumbers.push(result.events.TicketBought.returnValues._numbers)
            }
        } catch(e){
            console.log(e)
        }

        console.log("Printing tickets")
        for (let i = 0; i < buyer.length; i++) {
            console.log(buyer[i] + " " + buyersNumbers[i])
        }
        
        console.log("Inserting " + String(_k+25) + " faulty transaction to let block number go ahead")
        
        // inserting some faulty transaction to let block number go ahead
        for (let i = 0; i < _k+25; i++) {
            try{
                await try_contract.methods.buy([1,2,3,4,5,6]).send({
                    from: accounts[1],
                    gas: 15000000000,
                    gasPrice: '30000000000',
                    value: web3.utils.toWei("1", "gwei")
                })
            } catch(e){}
        }

        // Draw numbers
        let result = await try_contract.methods.drawNumbers().send({
            from: accounts[0],
            gas: 15000000000,
            gasPrice: '30000000000',
        })

        let winningNumbers = []
        try{
            for(const event of result.events.NewWinningNumber){
                winningNumbers.push(event.returnValues.number)
            }
        } catch(e) {}
        console.log("Printing winning numbers")
        console.log(winningNumbers)
    
        try{
            console.log("Checking for winners...")
            for(const event of result.events.NFTWin){
                console.log("address "+ event.returnValues._addr+ " wins nft of class "+event.returnValues._class);
            }
        } catch(e) {
            try{
                console.log("address "+ result.events.NFTWin.returnValues._addr+ " wins nft of class "+result.events.NFTWin.returnValues._class);
            }catch(e){
                console.log("No winners for this round")
            }
        }

        console.log("Closing lottery...")
        result = await try_contract.methods.closeLottery().send({
            from: accounts[0],
            gas: 15000000000,
            gasPrice: '30000000000',
        })
    });
)};