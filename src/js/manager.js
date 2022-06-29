App = {
    // Attributes
    contracts: {}, // Store contract abstractions
    web3Provider: null, // Web3 provider
    url: 'http://localhost:8545', // Url for web3
    account: '0x0', // current ethereum account
    isManager: false,
    tryAddress: null,

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
        return App.initFactory();
    },

    initFactory: function() { 
        /* Upload the contract's */
        // Store ETH current account
        web3.eth.getCoinbase(function(err, account) {
            if(err == null) {
                App.account = account;
            }
        });
        // retrieve the factory
        $.getJSON("TryFactory.json").done(function(data) {
            App.contracts["TryFactory"] = TruffleContract(data);
            App.contracts["TryFactory"].setProvider(App.web3Provider);
            //return App.listenForEvents();
            return App.initContract();
        });
    },

    initContract: function(){
        App.contracts["TryFactory"].deployed().then(async (instance) => {
            App.tryAddress = await instance.getLottteryAddr()
            // A Try contract has been deployed, retrieving it
            var jsonInt = await $.getJSON("Try.json") 
            var myContract = await TruffleContract(jsonInt)
            myContract.setProvider(App.web3Provider)
            App.contracts["Try"] = myContract//await myContract.at(tryAddress)
            return App.listenForEvents();
        })
    },

    listenForEvents: function() { 
        /* Activate event listeners */
        App.contracts["TryFactory"].deployed().then(async (instance) => {
            instance.LotteryCreated().on('data', function (event) {
                    alert("New lottery started!")
            });
        })
        App.contracts["Try"].at(App.tryAddress).then(async (instance) => {
            instance.NewRound().on('data', function (event) {
                alert("New round started!")
            });
            instance.NFTMint().on('data', function (event) {
                  
            });
            instance.ExtractedNumbers().on('data', function (event) {
                alert("Winning numbers extracted!")
            });
            instance.LotteryClosed().on('data', function (event) {
                alert("Lottery closed!")
            });
        });
        return App.render();
    },

    render: function(){
        App.contracts["Try"].at(App.tryAddress).then(async(instance) =>{
            // Loading information
            const v = await instance.owner();
            if (v.toLowerCase()==App.account){
                App.isManager = true;
                document.getElementById("mgmt").style.display="block";
            }
            console.log(App.isManager)
            var balance = await web3.eth.getBalance(instance.address);
            document.getElementById("lotteryBalance").innerHTML = parseInt(balance)/1000000000 + " GWEI"
            
            var isContractActive = await instance.isContractActive();
            var isRoundActive = await instance.isRoundActive();
            var isPrizeGiven = await instance.isPrizeGiven();
            var nBuyers = await instance.getBuyersLength();
            nBuyers = parseInt(nBuyers);
            var status = "";

            if (isContractActive){
                status = "Lottery is active. A round can be started";
                if(isRoundActive){
                    status = "A round is in progress";
                }
                else if (isPrizeGiven && (nBuyers>0)){
                    status = "Winning numbers extracted!"
                }
            } else if (!isContractActive){
                status = "Lottery is closed";
            } else{
                status = "Lottery is not yet started"
            }   
            document.getElementById("contractStatus").innerHTML = status
            if(nBuyers != "undefined"){
                document.getElementById("nBuyers").innerHTML = nBuyers
            } else document.getElementById("nBuyers").innerHTML = 0
        });
    },

    // Call a function of a smart contract
    createLottery: function(_M,_K,owner) {
        // here we need to close the previous lottery
        App.contracts["Try"].at(App.tryAddress).then(async(instance) =>{
            var isContractActive = await instance.isContractActive();
            if(isContractActive)
                await instance.closeLottery({from: App.account});
        })
        App.contracts["TryFactory"].deployed().then(async(instance) =>{
            // instantiate new contract
            await instance.createNewLottery({from: App.account})
            // update App reference
            App.tryAddress = await instance.getLottteryAddr()
            // reload contract
            return App.initContract();
        })
    },
    // Call a function of a smart contract
    startNewRound: function() {
        App.contracts["Try"].at(App.tryAddress).then(async(instance) =>{
            await instance.startNewRound({from: App.account});
        }).catch((err) => {
            if(err.message.includes("Lottery is closed.")){
                alert("Lottery is closed.")
            } else if (err.message.includes("A new round can start after the previous expires.")){
                alert("A new round can start after the previous expires.")
            } else if (err.message.includes("Wait for prizes before start a new round.")){
                alert("Wait for prizes before start a new round.")
            }
        });
    },

    // Call a function of a smart contract
    drawNumbers: function() {
        App.contracts["Try"].at(App.tryAddress).then(async(instance) =>{
            await instance.drawNumbers({from: App.account});
        }).catch((err) => {
            if(err.message.includes("Lottery is closed.")){
                alert("Lottery is closed.")
            } else if (err.message.includes("Too early to draw numbers")){
                alert("Too early to draw numbers")
            } else if (err.message.includes("Already drawn winning numbers.")){
                alert("Already drawn winning numbers.")
            } else alert("Extracted numbers are duplicated. Retry.")
        });
        console.log("drawNumbers")
    },

    // Call a function of a smart contract
    closeLottery: function() {
        App.contracts["Try"].at(App.tryAddress).then(async(instance) =>{
            await instance.closeLottery({from: App.account});
        }).catch((err) => {
            if(err.message.includes("Lottery is already closed."))
                alert("Lottery is already closed.")
        });
    }

}  

// Call init whenever the window loads
$(window).on('load', function () {
    App.init();
}); 

function setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

function checkCookie(cname) {
    let _cookie = getCookie(cname);
    if (_cookie != "") {
     return 1;
    } else return 0
}