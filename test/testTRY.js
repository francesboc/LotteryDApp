const TRY_template = artifacts.require("Try");

contract("Try", function(accounts) {

    describe("Constructor", function(){
        it("Should create the lottery", async function(){
            const TRY_instance = await TRY_template.new()
            const owner = await TRY_instance.owner()
            const isRoundActive = await TRY_instance.isRoundActive()

            console.log(owner)
            console.log(isRoundActive)
        });
    });

    describe("Functionalities of TRY", function(){
        it("Shloud start a new round", async function(){

            const TRY_instance = await TRY_template.new()
            await TRY_instance.startNewRound();

            const isRoundActive = await TRY_instance.isRoundActive()
            const roundDuration = await TRY_instance.roundDuration()
            
            assert.equal(isRoundActive, true, "The round should be active");
            console.log("This round will end at block: " + roundDuration);

        });
    });
});