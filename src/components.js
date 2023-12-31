import { createRoot } from 'react-dom/client';
import { Wallet } from './near-wallet';
import { useInitNear, Widget } from 'near-social-vm';
import { useEffect } from 'react';

const wallet = new Wallet({network: 'testnet'});

export default function Component({ src }) {

  const { initNear } = useInitNear();

  useEffect(() => {
    initNear && initNear({ networkId: wallet.network, selector: wallet.selector });
  }, [initNear]);

  return (
    <div>
      <Widget src={src} />
      <p className="mt-4 small"> <span class="text-secondary">Source:</span> <a href={`https://near.social/mob.near/widget/WidgetSource?src=${src}`}> {src} </a> </p>
    </div>
  );
}

// Setup on page load
document.addEventListener('DOMContentLoaded', async () => {
  let isSignedIn = await wallet.startUp();
  isSignedIn ? signedInUI() : signedOutUI();


  const domNode = document.getElementById('components');
  const root = createRoot(domNode);
  root.render(
    <div className='row-10'>
      <div className='col-18 mt-3'>
        <div className="row-5 col-5 input-group">
          <input placeholder="enter wallet id (copy paste for now)" id="greeting"/>
            <button id="wallet-btn"className="btn btn-primary">
              <span>submit</span>
              <div className="loader"></div>
            </button>
          <div className='row-10 mt-4'>
            <button className="btn btn-primary" id="display-wallet-summary" onClick={generateSummary}>Generate Activity Summary</button>
          </div>
          <div className="summary-display"></div>
        </div>
      </div>
    </div>
  );
});

async function queryEthAddress(walletAddress) {            //queries the eth address using etherscan API
  const etherScanAPIKey = "2KCHPQPJJJSKTQ281UI17F9Z8QIZ7ZDEZU";

  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${etherScanAPIKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.result;
  }
  catch(error) {
    window.alert("Couldn't retreive data:" + error.message);
  }
  
}

function simulateAiResponse(activities){      //simulating an AI response to activities, just a PoC
  let summary = "Activity Summary: \n"

  activities.forEach(activity => {            //checking which type of activity
    if(activity.functionName.includes('deposit')){
      summary += `For transaction ${activity.hash}, it is a ${activity.functionName} method used and the deposit value is ${activity.value}`;
    }
    else if(activity.functionName.includes('mint')) {
      summary += `For transaction ${activity.hash}, it is a ${activity.functionName} method used and the mint cost is ${activity.value}`;
    }
    else {
      summary += `For transaction ${activity.hash}, it is a ${activity.functionName} method used and the swap value is ${activity.value}`;
    }
  })

  return summary;
}

async function generateSummary() {    //generate summary by first retreiving wallet value
  try {
    const walletAddress = document.getElementById('greeting').value;
    const walletActivity = await queryEthAddress(walletAddress);
    const summary = simulateAiResponse(walletActivity);
    const walletSummaryDisplay = document.querySelector('.summary-display');
    walletSummaryDisplay.textContent = summary;
  } catch (error) {
    console.error("Error in generateSummary:", error);
    window.alert("Error occurred: " + error.message);
  }
}


async function categorizeOnChainActivites(activities) {
  let activityScore = 0;

  const activityGrade = {
    deposit: 5,
    mint: 7,
    swap: 3
  };

  activities.forEach(activity => {
    if(!activity) {
      window.alert("Couldn't get any activity from chain");
      activityScore = 0;
    }
    else if(activity.functionName && activity.functionName.includes('deposit')) {
      activityScore += activityGrade.deposit;
    }
    else if(activity.functionName && activity.functionName.includes('swap')) {
      activityScore += activityGrade.swap;
    }
    else if(activity.functionName && activity.functionName.includes('mint')) {
      activityScore += activityGrade.mint;
    }
  })

  return activityScore;
}

async function calculateRepScore(activityScore) {
  return Math.pow(activityScore, 2);
}

async function mintRepScore() {
  try {
    const walletAddress = '0x4aB7C05Ca6281deA5A95C40CD5B11ad0CFA5836E';
    const walletActivity = await queryEthAddress(walletAddress);
    const onChainActivityScore = await categorizeOnChainActivites(walletActivity);
    const score = await calculateRepScore(onChainActivityScore); // Pass the correct argument if needed
    if (!score) {
      window.alert("Sorry, unable to fetch score");
    } else {
      window.alert(`NFT for ${score}:`);
      const nftDiv = document.querySelector('.demo-nft');
      nftDiv.style.background = 'url(./assets/example-nft.png) no-repeat center center';
    }
  } catch (error) {
    console.error("Error in mintRepScore:", error);
    window.alert("Error occurred: " + error.message);
  }
}

// Button clicks
window.onload = function() {
  document.querySelector('#sign-in-button').addEventListener('click', wallet.signIn);
  document.querySelector('#sign-out-button').addEventListener('click', wallet.signOut);
  document.querySelector('#wallet-btn').addEventListener('click', mintRepScore);
  document.querySelector('#display-wallet-summary').addEventListener('click', generateSummary);
};

// UI: Display the signed-out container
function signedOutUI() {
  document.querySelectorAll('#sign-out-button').forEach(el => el.style.display = 'none');
}

// UI: Displaying the signed in flow container and fill in account-specific data
function signedInUI() {
  document.querySelectorAll('#sign-in-button').forEach(el => el.style.display = 'none');
  document.querySelectorAll('[data-behavior=account-id]').forEach(el => {
    el.innerText = wallet.accountId;
  });
}