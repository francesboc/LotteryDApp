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
        new Web3
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
                $("#accountId").html(account);
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
                if(!App.isManager){
                    alert("A new lottery has started, stay tuned for a new round to start!")
                    setLocalCookie("startNotified","yes")
                    // reload contract
                    return App.initContract();
                }
            });
        })
        App.contracts["Try"].at(App.tryAddress).then(async (instance) => {
            instance.NewRound().on('data', function (event) {
                if(!App.isManager)
                    alert("New round has started! Buy tickets now!")
                setCookie("roundNotified","yes")
            });
            // Ticket successfully bought, update interface
            instance.TicketBought().on('data', function (event) {
                var ticket = event.returnValues._numbers;
                var td1 = "<td class=\"u-border-1 u-border-grey-30 u-first-column u-table-cell u-table-cell-3\">"+ticket.slice(0,5)+"</td>"
                var td2 = "<td class=\"u-border-1 u-border-grey-30 u-table-cell u-table-cell-4\">"+ticket[5]+"</td>"
                document.getElementById("ticketPlaceList").innerHTML +=
                    "<tr style=\"height: 30px;\">" + td1 + td2 + "</tr>"
                alert("Ticket successfully bought! Thank you :)")
            });
            // Get wiinning numbers for this round
            instance.ExtractedNumbers().on('data', function (event) {
                if(!App.isManager)
                    alert("Winning numbers extracted!")
            });
            instance.NFTWin().on('data', function (event) {
                var _addr = event.returnValues._addr;
                if (_addr.toLowerCase() == App.account){
                    var _class = event.returnValues._class;
                    alert("Congratulations! You win a NFT of class "+_class)
                }
                console.log("NFT WIN")
            });
            instance.LotteryClosed().on('data', function (event) {
                if(!App.isManager)
                    alert("Lottery has been closed.")
                setLocalCookie("startNotified","no")
                setCookie("roundNotified","no")
            });
            instance.Refund().on('data', function (event) {
                var _addr = event.returnValues._addr;
                var _change = event.returnValues._change;
                if (App.account == _addr.toLowerCase()){
                    alert("You have been refunded for " + _change)
                }
            });
        });
        return App.render();
    },

    /**
     * Rendering the application.
     */
    render: function() { 
        /* Render page */ 
        App.contracts["Try"].at(App.tryAddress).then(async(instance) =>{
            const check = await instance.owner();
            if (check.toLowerCase()==App.account){
                App.isManager = true;
                document.getElementById("buttonManager").style.display="block";
                document.getElementById("buttonManager1").style.display="block";
            }
            var docElem = document.getElementById("ticketPrice1")
            if(docElem != null){
                var ticketPrice = await instance.ticketPrice();
                docElem.innerHTML= parseInt(ticketPrice)/1000000000 + " GWEI";
            }
            var isContractActive = await instance.isContractActive();
            var isRoundActive = await instance.isRoundActive();
            var isPrizeGiven = await instance.isPrizeGiven();
            var nBuyers = await instance.getBuyersLength();
            nBuyers = parseInt(nBuyers);
            // Cookie management for offline notification
            if(App.isManager==false){
                // notify if was offline for new lottery
                if (isContractActive && (getCookie("startNotified")=="no")){
                    alert("A new lottery has started, stay tuned for a new round to start!")
                    setLocalCookie("startNotified","yes")
                }
                // notify for a new round
                if (isRoundActive && !isPrizeGiven && (getCookie("roundNotified")=="no")){
                    alert("New round has started! Buy tickets now!")
                    setLocalCookie("roundNotified","yes")
                }
                // re-set cookie
                if (!isContractActive && (getCookie("startNotified")=="yes" || getCookie("roundNotified")=="yes")){
                    setLocalCookie("startNotified","no")
                    setLocalCookie("roundNotified","no")
                }
                if (isPrizeGiven && (getCookie("roundNotified")=="yes"))
                    setLocalCookie("roundNotified","no")
            }
            docElem = document.getElementById("extractedNumbers");
            // rendering winning numbers
            if(docElem != null){
                if (isPrizeGiven && (nBuyers>0)){
                    var winningNumbers = await instance.getWinningNumbers();
                    var banner = "Lucky numbers: ";
                    for(let i = 0; i <winningNumbers.length; i++) {
                        banner += winningNumbers[i].words[0] + " ";
                    }
                    document.getElementById("textExtractedNumbers").innerHTML=banner;
                    document.getElementById("extractedNumbers").style.display="block";
                }
            }
            // rendering user tickets
            docElem = document.getElementById("ticketsSection")
            if(docElem != null){
                var tickets = await instance.getTicketsFromAddress(App.account)
                if(tickets.length > 0){
                    for(let i = 0; i < tickets.length; i++) {
                        var numbers = tickets[i].numbers;
                        var td1 = "<td class=\"u-border-1 u-border-grey-30 u-first-column u-table-cell u-table-cell-3\">"+numbers.slice(0,5)+"</td>"
                        var td2 = "<td class=\"u-border-1 u-border-grey-30 u-table-cell u-table-cell-4\">"+numbers[5]+"</td>"
                        document.getElementById("ticketPlaceList").innerHTML +=
                            "<tr style=\"height: 30px;\">" + td1 + td2 + "</tr>"
                    }
                    docElem.style.display="block";
                }
            }
            // rendering NFTs
            docElem = document.getElementById("NFTSection")
            if(docElem != null){
                var nfts = await instance.getWonNFTsFromAddress(App.account)
                if(nfts.length > 0){
                    for(let i = 0; i < nfts.length; i++) {
                        var nftDescr = nfts[i];
                        var td1 = "<td class=\"u-border-1 u-border-grey-30 u-first-column u-table-cell u-table-cell-3\">"+nftDescr+"</td>"
                        document.getElementById("NFTlaceList").innerHTML +=
                            "<tr style=\"height: 30px;\">" + td1 + "</tr>"
                    }
                    docElem.style.display="block";
                }
            }
        });      
    },

    // Call a function of a smart contract
    buy: function(ticket) {
        App.contracts["Try"].at(App.tryAddress).then(async(instance) =>{
            var ticketPrice = await instance.ticketPrice();
            await instance.buy(ticket,{from: App.account, value: web3.utils.toWei(ticketPrice.toString(), 'wei')});
        }).catch((err) => {
            if(err.message.includes("You can buy a ticket when a new round starts")){
                alert("You can buy a ticket when a new round starts")
            }
            else if (err.message.includes("Round is closed. Try later.")){
                alert("Round is closed. Try later.")
            }
            else if (err.message.includes("Lottery is closed.")){
                alert("Lottery is closed.")
            }
        });
    }
}   

// Call init whenever the window loads
$(window).on('load', function () {
    if(getCookie('startNotified') == "")
        setLocalCookie("startNotified","no")
    if(getCookie('roundNotified') == "")
        setLocalCookie("roundNotified","no")
    App.init();
});

/**
 * Utility functions to manage cookies
 */
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

