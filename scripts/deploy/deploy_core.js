const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const account = createAccount();
  console.log("Using deployer address:", account.address);
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const codePath = path.join(__dirname, '../../contracts/CitationCourt.py');
  const code = fs.readFileSync(codePath, 'utf8');

  console.log("Deploying CitationCourt contract to Studionet...");
  const deployTxHash = await client.deployContract({
    code: code,
    args: [],
  });
  console.log("Deploy Transaction Hash:", deployTxHash);

  const receipt = await client.waitForTransactionReceipt({
    hash: deployTxHash,
    retries: 120,
    interval: 3000,
  });
  console.log("Deploy Receipt Status:", receipt.status_name);
  console.log("Deploy Receipt Result:", receipt.result_name);
  const contractAddress = receipt.recipient;
  console.log("Deployed CitationCourt Contract Address:", contractAddress);

  if (!contractAddress) {
    throw new Error("No contract address returned");
  }

  // 1. Initial State Read
  const initialStats = await client.readContract({
    address: contractAddress,
    functionName: 'get_stats',
    args: [],
  });
  console.log("Initial Stats:", initialStats);

  // 2. Lodge first claim (SUPPORTS fixture)
  const supportsUrl = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md";
  const claimText = "Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.";
  
  console.log("Lodging Claim 1 (SUPPORTS test)...");
  const lodgeTx1 = await client.writeContract({
    address: contractAddress,
    functionName: 'lodge_claim',
    args: [claimText, supportsUrl],
  });
  console.log("Lodge Claim 1 Tx Hash:", lodgeTx1);

  const lodgeReceipt1 = await client.waitForTransactionReceipt({
    hash: lodgeTx1,
    retries: 120,
    interval: 3000,
  });
  console.log("Lodge 1 Receipt Status:", lodgeReceipt1.status_name);
  console.log("Lodge 1 Receipt Result:", lodgeReceipt1.result_name);

  // 3. Read back claim 1
  const claim1 = await client.readContract({
    address: contractAddress,
    functionName: 'get_claim',
    args: ["1"],
  });
  console.log("Read back Claim 1:", claim1);

  // 4. Judge Claim 1
  console.log("Judging Claim 1 (executing multi-validator consensus)...");
  const startTime = Date.now();
  const judgeTx1 = await client.writeContract({
    address: contractAddress,
    functionName: 'judge_claim',
    args: ["1"],
  });
  console.log("Judge Claim 1 Tx Hash:", judgeTx1);

  const judgeReceipt1 = await client.waitForTransactionReceipt({
    hash: judgeTx1,
    retries: 120,
    interval: 3000,
  });
  const judgeElapsed1 = (Date.now() - startTime) / 1000;
  console.log(`Judge Claim 1 took ${judgeElapsed1.toFixed(2)}s`);
  console.log("Judge 1 Receipt Status:", judgeReceipt1.status_name);
  console.log("Judge 1 Receipt Result:", judgeReceipt1.result_name);

  // 5. Read back Ruling 1
  const ruling1 = await client.readContract({
    address: contractAddress,
    functionName: 'get_ruling',
    args: ["1"],
  });
  console.log("Read back Ruling 1:", ruling1);

  // Save core output
  const coreData = {
    deployer: account.address,
    contractAddress: contractAddress,
    deployTxHash: deployTxHash,
    deployReceipt: receipt,
    lodgeTx1: lodgeTx1,
    lodgeReceipt1: lodgeReceipt1,
    judgeTx1: judgeTx1,
    judgeReceipt1: judgeReceipt1,
    judgeLatencySec: judgeElapsed1,
    claim1: JSON.parse(claim1),
    ruling1: JSON.parse(ruling1),
  };

  fs.writeFileSync(
    path.join(__dirname, 'core_output.json'),
    JSON.stringify(coreData, null, 2)
  );
  console.log("Milestone 1 Core successfully deployed and verified! Saved to core_output.json");
}

main().catch(err => {
  console.error("Core deployment error:", err);
  process.exit(1);
});
