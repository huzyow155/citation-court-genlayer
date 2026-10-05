const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const deployments = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy/deployments.json'), 'utf8'));
  const deployTxHash = deployments.citationCourt.deployTxHash;
  const localContractPath = path.join(__dirname, '../contracts/CitationCourt.py');
  const localCode = fs.readFileSync(localContractPath, 'utf8');
  const localSha256 = crypto.createHash('sha256').update(localCode, 'utf8').digest('hex');

  const client = createClient({
    chain: chains.studionet,
    account: createAccount(),
  });

  console.log("Fetching deploy transaction receipt for:", deployTxHash);
  const receipt = await client.getTransactionReceipt({ hash: deployTxHash });
  
  console.log("Receipt status:", receipt.status_name);
  console.log("Recipient contract:", receipt.recipient);

  // Read code deployed
  console.log("Local code SHA-256:", localSha256);
  console.log("Deployment verified matches:", deployments.citationCourt.sourceSha256 === localSha256);
}

main().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
