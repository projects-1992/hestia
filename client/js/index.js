let Hestia;
let HestiaCreator;
let customWeb3;
let biconomy;
const Web3Modal = window.Web3Modal.default;
const Portis = window.Portis;
let web3Modal;
let provider;
let modalWeb3;
let selectedAccount;
let HestiaSigned;
let HestiaCreatorSigned;

let ercForwarderClient;
let permitClient;

window.addEventListener('load', async () => {

    customWeb3 = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.matic.today');
    Hestia = new ethers.Contract(contract_addresses['80001']['HestiaSuperApp'], hestiaAbi, customWeb3.getSigner());
    HestiaCreator = new ethers.Contract(contract_addresses['80001']['HestiaCreator'], hestiaCreatorAbi, customWeb3.getSigner());
    await init();

    console.clear();
    console.log(`
    ██╗  ██╗███████╗███████╗████████╗██╗ █████╗
    ██║  ██║██╔════╝██╔════╝╚══██╔══╝██║██╔══██╗
    ███████║█████╗  ███████╗   ██║   ██║███████║
    ██╔══██║██╔══╝  ╚════██║   ██║   ██║██╔══██║
    ██║  ██║███████╗███████║   ██║   ██║██║  ██║
    ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═╝
            Made with ❤ by Anudit Nagar
    `);

});

async function requireLogin(){

    const providerOptions = {
        portis: {
            package: Portis,
            options: {
              id: "609e8124-9614-44e6-afd8-03a52b5f6add",
              network: 'maticMumbai'
            }
        }
    };

    web3Modal = new Web3Modal({
        theme: "dark",
        network: "matic",
        cacheProvider: true,
        providerOptions,
    });

    if (web3Modal.cachedProvider == "") {
        provider = await web3Modal.connect();
        console.log("provider is", provider);
    }
    else{
        provider = await web3Modal.connectTo(web3Modal.cachedProvider);
        console.log("cached provider is", provider);
    }

    window.accounts = [];


    if (provider.isMetaMask === true){

        ethereum.autoRefreshOnNetworkChange = false;
        if (provider && provider.on){
            provider.on('disconnect', ()=>{
                window.location.reload()
            });
            provider.on('chainChanged', ()=>{
                window.location.reload()
            });
            provider.on('accountsChanged', ()=>{
                window.location.reload()
            });
        }

        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        biconomy = new Biconomy(window.ethereum,{apiKey: "zgMOuSoVm.ee90efe8-31d3-4416-88f0-cae22db150f5"});
        biconomy.onEvent(biconomy.READY, () => {
            // Initialize your dapp here like getting user accounts etc
            ercForwarderClient = biconomy.erc20ForwarderClient;
            permitClient = biconomy.permitClient;
        }).onEvent(biconomy.ERROR, (error, message) => {
            console.log(error, message);
        });
        modalWeb3 = new ethers.providers.Web3Provider(biconomy);

        window.netId = parseInt(ethereum.chainId);

        if(Object.keys(supportedChains).includes(netId.toString()) === false){
            alert('Please switch to Matic Mumbai Testnet or Binance Smart Chain Testnet.')
            let alHtml = '<ul class="list-group list-group">';
            Object.keys(supportedChains).forEach((chainID)=>{
                alHtml+=`<li class="list-group-item">${supportedChains[chainID]}</li>`
            })
            alHtml += '</ul>';
            alert('Plase switch to Matic Mumbai Testnet or Binance Smart Chain Testnet.');
        }
        else {
            setupContracts(accounts, netId);
        }

    }
    else if (provider.isPortis === true){
        accounts = await provider.enable();
        const biconomy = new Biconomy(provider,{apiKey: "zgMOuSoVm.ee90efe8-31d3-4416-88f0-cae22db150f5"});
        modalWeb3 = new ethers.providers.Web3Provider(biconomy);
        setupContracts(accounts, '80001');
    }
    else {
        alert('Unsupported Wallet.')
    }

    window.modalWeb3 = modalWeb3;
}

function setupContracts(accounts, netId){
    HestiaSigned = new ethers.Contract(
        contract_addresses[netId.toString()]['HestiaSuperApp'],
        hestiaAbi, modalWeb3.getSigner()
    );
    HestiaCreatorSigned = new ethers.Contract(
        contract_addresses[netId.toString()]['HestiaCreator'],
        hestiaCreatorAbi, modalWeb3.getSigner()
    );
    window.accounts = accounts;
}

async function getLatestMaticBlockNumber(){
    let promise = new Promise((res, rej) => {
        fetch("https://rpc-mainnet.maticvigil.com/v1/36aed576f085dcef42748c474a02b1c51db45c86", {
        "headers": {
            "content-type": "application/json",
        },
        "body": "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_blockNumber\",\"params\":[]}",
        "method": "POST",
        })
        .then(response => response.json())
        .then(data => {
            res(data.result);
        })
        .catch((error) => {
            rej(error);
        });
    });
    let result = await promise;
    return result;
}

async function queryGraphQL(query = '') {

    let promise = new Promise((res, rej) => {

        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var graphql = JSON.stringify({
        query: query
        })

        var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: graphql,
        redirect: 'follow'
        };

        fetch(graphqlEndpoint, requestOptions)
        .then(response => response.json())
        .then(result => res(result['data']))
        .catch(error => {
        console.log('error', error);
            res({})
        });

    });
    let result = await promise;
    return result;

}

function trimhash(_hash = "", w = 6){
    return _hash.slice(0, w) +"..."+ _hash.slice(_hash.length-w, _hash.length)
}

function trimAdd(_addr = ""){
    return _addr.slice(0, 5) +"..."+ _addr.slice(_addr.length-3, _addr.length)
}

function openInExplorer(_add = getAddress()){
    window.open(`${chainExplorers[customWeb3._network.chainId]}/address/${_add}`)
}

function sendIPFSPinningRequests(_ipfsHash, _name = ''){

    fetch(`https://ipfs.infura.io:5001/api/v0/pin/add?arg=/ipfs/${_ipfsHash}`, {
        method: 'POST',
        redirect: 'follow'
    })
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

    var myHeaders = new Headers();
        myHeaders.append("pinata_api_key", "22adbce12b4314b7e08b");
        myHeaders.append("pinata_secret_api_key", "1e746a0259982c83e47bb94e6b5295d546f006bbb8b8125173f4b5707c7d1756");
        myHeaders.append("Content-Type", "application/json");

    fetch("https://api.pinata.cloud/pinning/pinByHash", {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({
            "name": _name,
            "hashToPin":_ipfsHash
        }),
    })
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

}
function injectScript(src) {
    console.log("Injecting : ",src )
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.addEventListener('load', resolve);
        script.addEventListener('error', e => reject(e.error));
        document.head.appendChild(script);
    });
}

function sanitize(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// UNSAFE with unsafe strings; only use on previously-escaped ones!
function unescapeHtml(escapedStr) {
    var div = document.createElement('div');
    div.innerHTML = escapedStr;
    var child = div.childNodes[0];
    return child ? child.nodeValue : '';
}

function getParameterByName(name) {
    url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
