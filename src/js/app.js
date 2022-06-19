App = {
    // Attributes
    contracts: {}, // Store contract abstractions
    web3Provider: null, // Web3 provider
    url: 'http://localhost:8545', // Url for web3
    account: '0x0', // current ethereum account


    init: async function() { return await App.initWeb3(); },

    // Functions
    initWeb3: async function() { 
        // Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
    
            try{
                // Request account access
                await window.ethereum.request({method: "eth_requestAccounts"});
            } catch (error) {
                // User denied account access
                console.error("User denied account access");
            }
        }
        // Legacy dapp browser
        else if (window.web3){
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else{
            App.web3Provider = new Web3.providers.HttpProvider(url);
        }
        web3 = new Web3(App.web3Provider);
        return App.initContract();
    },

    initContract: function() { 
        /* Upload the contract's */
        // Store ETH current account
        console.log("InitContract")
        web3.eth.getCoinbase(function(err, account) {
            if(err == null) {
                App.account = account;
                console.log(account);
                $("#accountId").html("Your address: " + account);
            }
        });
        $.getJSON("Try.json").done(function(data) {
            App.contracts["Try"] = TruffleContract(data);
            App.contracts["Try"].setProvider(App.web3Provider);
            return App.listenForEvents();
        });
           
        //return App.listenForEvents(); 
    },

    listenForEvents: function() { 
        /* Activate event listeners */
        //App.contracts["Try"].deployed().then(async (instance) => {
        //    web3.eth.getBlockNumber(function (error, block) {
        //        // click is the Solidity event
        //        instance.click().on('data', function (event) {
        //            $("#eventId").html("Event catched!");
        //            console.log("Event catched");
        //            console.log(event);
        //            console.log(block); // If you want to get the block
        //        });  
        //    });
        //});
           
        return App.render();
    },

    render: function() { 
        /* Render page */ 
        App.contracts["Try"].deployed().then(async(instance) =>{
            // Call the value function (value is a public attribute)
            //const v = await instance.value();
            //console.log(v);
            $("#valueId").html("" + 0);
        });      
    },

    // Call a function of a smart contract
    // The function send an event that triggers a transaction:: Metamask pops up and
    // ask the user to confirm the transaction
    startNewRound: function() {
        console.log("StartNewRound")
        App.contracts["Try"].deployed().then(async(instance) =>{
            await instance.startNewRound({from: App.account});
        });
    }
}   

// Call init whenever the window loads
$(function() {
    $(window).on('load', function () {
        console.log("inizio")
        App.init();
        console.log("fine");
    });
}); 