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
            return App.render();
        });
    
        //return App.listenForEvents(); 
    },

    render: function(){
        App.contracts["Try"].deployed().then(async(instance) =>{
            const v = await instance.owner(); // Solidity uint are Js BigNumbers 
            if (v==App.account){
                App.isManager = true;
                document.getElementById("mgmt").style.display="block";
            }
        });
    }
}  

//App.init()
// Call init whenever the window loads
$(function() {
    $(window).on('load', function () {
        App.init();
    });
}); 


//<script> 
//  var owner = App.getOwner()
//  var currentAccount = App.getAccount()
//  if (owner != currentAccount){
//    alert("Ops")
//  }
//</script>