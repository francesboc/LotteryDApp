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
            instance.NFTMint().on('data', function (event) {
                /*var _class = event.returnValues._class;
                //async createNFTFromAssetData(content, options) {
                // add the asset to IPFS
                const filePath = options.path || 'asset.bin'
                const basename =  path.basename(filePath)
                
                // When you add an object to IPFS with a directory prefix in its path,
                // IPFS will create a directory structure for you. This is nice, because
                // it gives us URIs with descriptive filenames in them e.g.
                // 'ipfs://bafybeihhii26gwp4w7b7w7d57nuuqeexau4pnnhrmckikaukjuei2dl3fq/cat-pic.png' vs
                // 'ipfs://bafybeihhii26gwp4w7b7w7d57nuuqeexau4pnnhrmckikaukjuei2dl3fq'
                const ipfsPath = '/nft/' + basename
                const { cid: assetCid } = await this.ipfs.add({ path: ipfsPath, content })
                
                // make the NFT metadata JSON
                const assetURI = ensureIpfsUriPrefix(assetCid) + '/' + basename
                const metadata = await this.makeNFTMetadata(assetURI, options)
                
                // add the metadata to IPFS
                const { cid: metadataCid } = await this.ipfs.add({ 
                    path: '/nft/metadata.json', 
                    content: JSON.stringify(metadata)
                })
                const metadataURI = ensureIpfsUriPrefix(metadataCid) + '/metadata.json'
                
                // get the address of the token owner from options, 
                // or use the default signing address if no owner is given
                let ownerAddress = options.owner
                if (!ownerAddress) {
                    ownerAddress = await this.defaultOwnerAddress()
                }
                
                // mint a new token referencing the metadata URI
                const tokenId = await this.mintToken(ownerAddress, metadataURI)
                
                // format and return the results
                return {
                    tokenId,
                    metadata,
                    assetURI,
                    metadataURI,
                    assetGatewayURL: makeGatewayURL(assetURI),
                    metadataGatewayURL: makeGatewayURL(metadataURI),
                }*/
                  
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
            // Loading information
            const v = await instance.owner(); // Solidity uint are Js BigNumbers 
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
            var nTicketBougth = await instance.getTicketsLength();
            nTicketBougth = parseInt(nTicketBougth);
            var status = "Lottery is closed";

            if (isContractActive){
                status = "Lottery is active. A round can be started";
                if(isRoundActive){
                    status = "A round is in progress";
                }
                else if (isPrizeGiven && (nTicketBougth>0)){
                    status = "Winning numbers extracted. Waiting for next command..."
                }
            }
            document.getElementById("contractStatus").innerHTML = status
            document.getElementById("nTicketBougth").innerHTML = nTicketBougth
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