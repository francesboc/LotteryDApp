App = {
    // Attributes
    contracts: {}, // Store contract abstractions
    web3Provider: null, // Web3 provider
    url: 'http://localhost:8545', // Url for web3
    account: '0x0', // current ethereum account
    isManager: false,

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
        web3.eth.getCoinbase(function(err, account) {
            if(err == null) {
                App.account = account;
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
        App.contracts["Try"].deployed().then(async (instance) => {
            instance.LotteryCreated().on('data', function (event) {
                console.log("Event catched");
                setCookie('lotteryStart',"1")
                console.log(event);
            });
            instance.LotteryClosed().on('data', function (event) {
                console.log("Event catched");
                setCookie('lotteryStart',"0")
                console.log(event);
            });
        });
        return App.render();
    },

    render: function(){
        App.contracts["Try"].deployed().then(async(instance) =>{
            const v = await instance.owner(); // Solidity uint are Js BigNumbers 
            if (v.toLowerCase()==App.account){
                App.isManager = true;
                document.getElementById("mgmt").style.display="block";
            }
        });
    },

    // Call a function of a smart contract
    createLottery: function() {
        App.contracts["Try"].deployed().then(async(instance) =>{
            await instance.createLottery({from: App.account});
        });
        console.log("createLottery")
    },

    // Call a function of a smart contract
    startNewRound: function() {
        App.contracts["Try"].deployed().then(async(instance) =>{
            await instance.startNewRound({from: App.account});
        });
        console.log("StartNewRound")
    },

    // Call a function of a smart contract
    drawNumbers: function() {
        App.contracts["Try"].deployed().then(async(instance) =>{
            await instance.drawNumbers({from: App.account});
        });
        console.log("drawNumbers")
    },

    // Call a function of a smart contract
    closeLottery: function() {
        App.contracts["Try"].deployed().then(async(instance) =>{
            await instance.closeLottery({from: App.account});
        });
        console.log("closeLottery")
    }
}  

//App.init()
// Call init whenever the window loads
$(function() {
    $(window).on('load', function () {
        App.init();
    });
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