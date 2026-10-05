const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const coreOutputPath = path.join(__dirname, 'core_output.json');
  const coreData = JSON.parse(fs.readFileSync(coreOutputPath, 'utf8'));
  const citationCourtAddress = coreData.contractAddress;

  const account = createAccount();
  console.log("Using consumer deployer address:", account.address);
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const codePath = path.join(__dirname, '../../examples/consumer/consumer.py');
  const code = fs.readFileSync(codePath, 'utf8');

  console.log("Deploying CitedBoard consumer contract connected to:", citationCourtAddress);
  const deployTxHash = await client.deployContract({
    code: code,
    args: [citationCourtAddress],
  });
  console.log("Consumer Deploy Tx:", deployTxHash);

  const receipt = await client.waitForTransactionReceipt({
    hash: deployTxHash,
    retries: 120,
    interval: 3000,
  });
  console.log("Deploy Status:", receipt.status_name);
  console.log("Deploy Result:", receipt.result_name);
  const consumerAddress = receipt.recipient;
  console.log("Deployed CitedBoard Address:", consumerAddress);

  // Test 1: Post referencing claim 1 (which has SUPPORTS verdict) -> Must SUCCEED
  console.log("Posting headline referencing Claim 1 (SUPPORTS)...");
  const postTx1 = await client.writeContract({
    address: consumerAddress,
    functionName: 'post',
    args: ["1", "Verified: Project Nova reported 42% revenue increase in Q3."],
  });
  console.log("Post Tx 1:", postTx1);

  const postReceipt1 = await client.waitForTransactionReceipt({
    hash: postTx1,
    retries: 120,
    interval: 3000,
  });
  console.log("Post 1 Status:", postReceipt1.status_name);
  console.log("Post 1 Result:", postReceipt1.result_name);

  // Read back post 1
  const post1 = await client.readContract({
    address: consumerAddress,
    functionName: 'get_post',
    args: ["1"],
  });
  console.log("Read back Post 1:", post1);

  // Read back list_posts
  const postsList = await client.readContract({
    address: consumerAddress,
    functionName: 'list_posts',
    args: [10],
  });
  console.log("Read back Posts List:", postsList);

  const consumerEvidence = {
    consumerAddress: consumerAddress,
    deployTxHash: deployTxHash,
    citationCourtAddress: citationCourtAddress,
    postTx1: postTx1,
    postReceipt1: postReceipt1,
    post1: JSON.parse(post1),
    postsList: JSON.parse(postsList),
  };

  fs.writeFileSync(
    path.join(__dirname, 'consumer_output.json'),
    JSON.stringify(consumerEvidence, null, 2)
  );
  console.log("CitedBoard consumer verified on Studionet! Saved to consumer_output.json");
}

main().catch(err => {
  console.error("Consumer deploy error:", err);
  process.exit(1);
});
