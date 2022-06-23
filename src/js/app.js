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
        console.log("InitContract")
        web3.eth.getCoinbase(function(err, account) {
            if(err == null) {
                App.account = account;
                console.log(account);
                $("#accountId").html(account);
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
                if(App.isManager==false){
                    alert("A new lottery has started, stay tuned for a new round to start!")
                    setLocalCookie("notified","yes")
                }
                console.log(event);
            });
            instance.NewRound().on('data', function (event) {
                alert("New round has started! Buy tickets now!")
                // Delete previous tickets
                document.cookie = "tickets=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                //setCookie("notified","yes")
                console.log(event);
            });
            // Ticket successfully bought, update interface
            instance.TicketBought().on('data', function (event) {
                var ticket = event.returnValues._numbers;
                // Saving ticket of user
                var savedTickets = getCookie("tickets");
                if (savedTickets == '')
                    savedTickets = []
                else savedTickets = JSON.parse(savedTickets);
                savedTickets.push(ticket)
                setLocalCookie("tickets",JSON.stringify(savedTickets))

                var td1 = "<td class=\"u-border-1 u-border-grey-30 u-first-column u-table-cell u-table-cell-3\">"+ticket.slice(0,5)+"</td>"
                var td2 = "<td class=\"u-border-1 u-border-grey-30 u-table-cell u-table-cell-4\">"+ticket[5]+"</td>"
                document.getElementById("ticketPlaceList").innerHTML +=
                    "<tr style=\"height: 30px;\">" + td1 + td2 + "</tr>"
                alert("Ticket successfully bought! Thank you :)")
                console.log(event);
            });
            // Get wiinning numbers for this round
            instance.ExtractedNumbers().on('data', function (event) {
                var winningNumbers = event.returnValues.winningNumbers
                console.log(winningNumbers);
            });
            instance.LotteryClosed().on('data', function (event) {
                alert("Lottery has been closed")
                setLocalCookie("notified","no")
                console.log(event);
            });
        });
        return App.render();
    },

    render: function() { 
        /* Render page */ 
        App.contracts["Try"].deployed().then(async(instance) =>{
            // Call the value function (value is a public attribute)
            const check = await instance.owner();
            if (check.toLowerCase()==App.account){
                App.isManager = true;
                document.getElementById("buttonManager").style.display="block";
                document.getElementById("buttonManager1").style.display="block";
                //$("#valueId").html("" + 0);
            }
            console.log(App.isManager)
            var isContractActive = await instance.isContractActive();
            if(App.isManager==false && isContractActive && (getCookie("notified")=="no")){
                alert("A new lottery has started, stay tuned for a new round to start!")
                setLocalCookie("notified","yes")
            } else if(isContractActive==false && (getCookie("notified")=="no")){
                setLocalCookie("notified","no")
            }
        });      
    },

    // Call a function of a smart contract
    buy: function(ticket) {
        console.log("buy")
        App.contracts["Try"].deployed().then(async(instance) =>{
            await instance.buy(ticket,{from: App.account, value: web3.utils.toWei('10', 'gwei')});
        });
    }
}   

// Call init whenever the window loads
//$(function() {
$(window).on('load', function () {
    if(getCookie('notified') == ""){
        console.log("Setting local cookie")
        setLocalCookie("notified","no")
    }
    App.init();
    var savedTickets = getCookie("tickets");
    if (savedTickets != ''){
        var docElem = document.getElementById("ticketsSection")
        if(docElem != null)
            docElem.style.display="block";
    }
});
//});

function setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";path=/";
}

function setLocalCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue;
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

