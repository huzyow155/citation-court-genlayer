const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const fs = require('fs');
const path = require('path');
const { createClient, chains, createAccount } = require('genlayer-js');

const client = createClient({
  chain: chains.studionet,
  account: createAccount(),
});

const txList = [
  { name: "CitationCourt Deploy", hash: "0x99c85d3d9820f1fc691559dfb0ec5e1744adf6ef77c132c54c51b6f26dcc2c04" },
  { name: "Case A (Supports) Judge", hash: "0xa64cd6227bd3ed898d955f01fb44bd05e234ae4219c4b3b7f2e8d0b2a85ba0ea" },
  { name: "Case B (Contradicts) Judge", hash: "0xfd75f4f5d4a3bcd42d4bcc541b6da938962bc88d8baa6ad3db49c77495d4fe7f" },
  { name: "Case C (Not Addressed) Judge", hash: "0xa5a690dd6fd068bd08e3118fe8dc3583af8f30fd64cfe4e9567bd3b50dff7cc4" },
  { name: "Case D (Near Miss) Judge", hash: "0x7fdb59625542ea1ddc594f04e382f5ed50c38e1d71fac7cd61c6a20f6ca4b3e0" },
  { name: "Case E (Prompt Injection) Judge", hash: "0x469a88b87f8b57395755fe0a8e65e6963b818df756101174c16feb015eddb651" },
  { name: "Case F Run 1 (404 Unreadable) Judge", hash: "0x1cab8dedfa68b3ddfec5e0f4a2b1bbec1e0eb1847399eb7c97f34c3bb34641f8" },
  { name: "Case F Run 2 (Re-judge Unreadable)", hash: "0xc3bbd9392441e1754ad32174b405419899ca1856d53d63c4edbeaa5e2ccc1ce2" },
  { name: "Case G (Short Page Unreadable) Judge", hash: "0xc140440182750ea3f4f12ea0ce6e6b1c9bd94c98c499de77753ffed7367f8b65" },
  { name: "Case H (Wiki Earth Supports) Judge", hash: "0xdb555c3638b551b6aeef67a88b2f58063881995af5ba449d2c8e4c6d4c261ecf" },
  { name: "CitedBoard Deploy", hash: "0xda0bfe5a8cc325a79eb10db9147eec71f4f15ffd539a5a2fa9c8690f5c0a548e" },
  { name: "CitedBoard Post Article", hash: "0x9c6d6e6b6021d9c1b6049cfb236dab89fab565820a7d1ce7e2383ecc928b1df8" },
];

async function main() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Fetching raw receipts for 12 transactions from GenLayer Studionet RPC...`);

  const results = {};

  for (let i = 0; i < txList.length; i++) {
    const item = txList[i];
    console.log(`[${i + 1}/12] Fetching ${item.name} (${item.hash})...`);
    try {
      const receipt = await client.waitForTransactionReceipt({
        hash: item.hash,
        retries: 20,
        interval: 2000,
      });
      results[item.hash] = {
        name: item.name,
        hash: item.hash,
        status_name: receipt.status_name,
        result_name: receipt.result_name,
        execution_result: receipt.consensus_data?.leader_receipt?.[0]?.execution_result || null,
        receipt: receipt,
      };
      console.log(`  -> status: ${receipt.status_name}, result: ${receipt.result_name}, execution_result: ${results[item.hash].execution_result}`);
    } catch (err) {
      console.error(`  -> Failed for ${item.hash}:`, err.message);
      results[item.hash] = {
        name: item.name,
        hash: item.hash,
        error: err.message,
      };
    }
  }

  const outPayload = {
    fetched_at: timestamp,
    rpc_endpoint: "https://studio.genlayer.com/api",
    total_transactions: txList.length,
    transactions: results,
  };

  const outPath = path.join(__dirname, 'deploy', 'receipts_raw.json');
  fs.writeFileSync(outPath, JSON.stringify(outPayload, null, 2), 'utf8');
  console.log(`Successfully saved raw receipts for all ${txList.length} transactions to: ${outPath}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
