const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const deployments = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy', 'deployments.json'), 'utf8'));
  const contractAddress = deployments.citationCourt.address;

  const client = createClient({
    chain: chains.studionet,
    account: createAccount(),
  });

  const timestamp = new Date().toISOString();
  console.log(`QUERY_TIMESTAMP: ${timestamp}`);
  console.log(`CONTRACT_ADDRESS: ${contractAddress}`);

  const rawStats = await client.readContract({
    address: contractAddress,
    functionName: 'get_stats',
    args: [],
  });
  console.log(`RAW_GET_STATS:\n${rawStats}`);

  const rawRecent = await client.readContract({
    address: contractAddress,
    functionName: 'list_recent',
    args: [10],
  });
  console.log(`RAW_LIST_RECENT_10:\n${rawRecent}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
