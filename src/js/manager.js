App = {
    // Attributes
    contracts: {}, // Store contract abstractions
    web3Provider: null, // Web3 provider
    url: 'http://localhost:8545', // Url for web3
    account: '0x0', // current ethereum account
    isManager: false, // tell if the connected user is the manager
    tryAddress: null, // it stores the address of the deployed contract

    init: async function() { return await App.initWeb3(); },

    /**
     * This function initialize Web3
     * @returns Initialization of lottery factory
     */
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

    /**
     * Load the TryFactory contract by which the Try contract
     * instance is retrieved.
     */
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
            return App.initContract();
        });
    },

    /**
     * Retrieve the Try contract
     */
    initContract: function(){
        App.contracts["TryFactory"].deployed().then(async (instance) => {
            App.tryAddress = await instance.getLottteryAddr()
            // Here we are retrieving the instantiated contract
            var jsonInt = await $.getJSON("Try.json") 
            var myContract = await TruffleContract(jsonInt)
            myContract.setProvider(App.web3Provider)
            App.contracts["Try"] = myContract
            return App.listenForEvents();
        })
    },

    /**
     * Listener for important events from the backend.
     */
    listenForEvents: function() { 
        /* Activate event listeners */
        App.contracts["TryFactory"].deployed().then(async (instance) => {
            instance.LotteryCreated().on('data', function (event) {
                alert("New lottery started!")
                // reload contract
                return App.initContract();
            });
        })
        App.contracts["Try"].at(App.tryAddress).then(async (instance) => {
            instance.NewRound().on('data', function (event) {
                alert("New round started!")
                window.location.reload()
            });
            instance.ExtractedNumbers().on('data', function (event) {
                alert("Winning numbers extracted!")
            });
            instance.TicketBought().on('data', function (event) {
                alert("New ticket purchased")
            });
            instance.ChangeBack().on('data', function (event) {
                var cause = event.returnValues.str;
                if (cause =="Operator refunded"){
                    var balance = event.returnValues._change;
                    alert("Operator refundef for "+balance)
                    window.location.reload()
                }
            });
            instance.LotteryClosed().on('data', function (event) {
                alert("Lottery closed!")
                window.location.reload()
            });
        });
        return App.render();
    },

    /**
     * Rendering the application.
     */
    render: function(){
        App.contracts["Try"].at(App.tryAddress).then(async(instance) =>{
            // Loading information
            const v = await instance.owner();
            if (v.toLowerCase()==App.account){
                App.isManager = true;
                // display only if owner
                document.getElementById("mgmt").style.display="block";
            }
            // getting balance to show
            var balance = await web3.eth.getBalance(instance.address);
            document.getElementById("lotteryBalance").innerHTML = parseInt(balance)/1000000000 + " GWEI"
            
            var isContractActive = await instance.isContractActive();
            var isRoundActive = await instance.isRoundActive();
            var isPrizeGiven = await instance.isPrizeGiven();
            var nBuyers = await instance.getBuyersLength();
            var roundDuration = await instance.roundDuration();
            nBuyers = parseInt(nBuyers);
            var status = "";
            // update dapp status
            if (isContractActive){
                status = "Lottery is active. A round can be started";
                if(isRoundActive){
                    status = "A round is in progress. It will end at block "+roundDuration;
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
                // render buyers
                if(nBuyers > 0){
                    docElem = document.getElementById("buyersSection")
                    for(var i = 0; i < nBuyers; i++) {
                        var buyerAddr = await instance.buyers(i);
                        var player = await instance.players(buyerAddr)
                        var td1 = "<td class=\"u-border-1 u-border-grey-40 u-border-no-left u-border-no-right u-table-cell\">"+buyerAddr+"</td>"
                        var td2 = "<td class=\"u-border-1 u-border-grey-40 u-border-no-left u-border-no-right u-table-cell\">"+player.nTicket+"</td>"
                        document.getElementById("buyersPlaceList").innerHTML +=
                            "<tr style=\"height: 30px;\">" + td1 + td2 + "</tr>"
                    }
                    docElem.style.display="block";
                }
            } else document.getElementById("nBuyers").innerHTML = 0
            
        });
    },

    // Smart contract functions:

    createLottery: function(_M,_K, price) {
        // here we need to close the previous lottery
        App.contracts["Try"].at(App.tryAddress).then(async(instance) =>{
            var isContractActive = await instance.isContractActive();
            if(isContractActive)
                await instance.closeLottery({from: App.account});
        })
        App.contracts["TryFactory"].deployed().then(async(instance) =>{
            // instantiate new contract
            await instance.createNewLottery(_M, _K, price, {from: App.account})
            // update App reference
            //App.tryAddress = await instance.getLottteryAddr()
            // update reference in KittyNFT
            //await instance.setLotteryAddr(App.tryAddress,{from: App.account})
            // reload contract
            //return App.initContract();
        })
    },

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
    },

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

/**
 * Utility functions to manage cookies
 */
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