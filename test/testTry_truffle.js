const MyContract = artifacts.require("Try");

contract("Testing MyContract", function(accounts) {

    const alice = accounts[0];

    describe("Testing increase() function", function() {

        it("Should increase the value correctly with input > 0", async function() {

            // 1. Set a valid state
            const instance = await MyContract.new(5,1);
            // 2. Execute the function to test
            await instance.startNewRound();
            // 3. Test the result
            const res = await instance.isRoundActive();
            console.log(res);
        });
    });
});