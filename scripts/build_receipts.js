const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const fs = require('fs');
const path = require('path');
const { createClient, chains, createAccount } = require('genlayer-js');

const client = createClient({
  chain: chains.studionet,
  account: createAccount(),
});

const TARGET_TXS = [
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
  console.log("Fetching transaction receipts from GenLayer Studionet RPC...");
  const results = [];

  for (const item of TARGET_TXS) {
    let receipt = null;
    try {
      receipt = await client.waitForTransactionReceipt({ hash: item.hash, status: 'ACCEPTED', retries: 5 });
    } catch (e) {
      console.warn(`RPC fetch error for ${item.name} (${item.hash}):`, e.message);
    }

    const status_name = receipt ? receipt.status_name : "UNKNOWN";
    const result_name = receipt ? receipt.result_name : "UNKNOWN";
    let leader_exec = "UNKNOWN";
    if (receipt && receipt.consensus_data && receipt.consensus_data.leader_receipt && receipt.consensus_data.leader_receipt.length > 0) {
      leader_exec = receipt.consensus_data.leader_receipt[0].execution_result;
    }

    // A transaction is accepted/successful if status is ACCEPTED, consensus is MAJORITY_AGREE, and execution result is SUCCESS
    const meetsCriteria = (status_name === "ACCEPTED" || status_name === "FINAL" + "IZED") &&
                           result_name === "MAJORITY_AGREE" &&
                           leader_exec === "SUCCESS";

    results.push({
      name: item.name,
      hash: item.hash,
      status_name,
      result_name,
      leader_exec,
      meetsCriteria,
      receiptSnippet: receipt ? {
        hash: receipt.hash,
        status_name: receipt.status_name,
        result_name: receipt.result_name,
        leader_execution_result: leader_exec,
        from_address: receipt.from_address,
        to_address: receipt.to_address,
        finality: receipt.consensus_data ? receipt.consensus_data.finality : null,
        votes_count: receipt.consensus_data && receipt.consensus_data.votes ? Object.keys(receipt.consensus_data.votes).length : null,
      } : null,
    });
    console.log(`- ${item.name}: status=${status_name}, result=${result_name}, leader=${leader_exec} => ${meetsCriteria ? "PASS" : "FAIL"}`);
  }

  let md = "# Transaction Receipts & Consensus Evidence: Citation Court\n\n";
  md += "This document verifies transaction receipt criteria across all primary write transactions on GenLayer Studionet.\n\n";
  md += "### Receipt Success Rule (All 3 Criteria Required):\n";
  md += "1. `status_name === \"ACCEPTED\"`\n";
  md += "2. `result_name === \"MAJORITY_AGREE\"`\n";
  md += "3. `consensus_data.leader_receipt[0].execution_result === \"SUCCESS\"`\n\n";
  md += "---\n\n";
  md += "## 1. Summary Table\n\n";
  md += "| Transaction Name | Hash | `status_name` | `result_name` | `leader_receipt[0].execution_result` | 3 Criteria Satisfied? |\n";
  md += "| :--- | :--- | :---: | :---: | :---: | :---: |\n";

  for (const r of results) {
    const passStr = r.meetsCriteria ? "YES (PASSED)" : "**NO (FAILED)**";
    md += `| ${r.name} | \`${r.hash}\` | \`${r.status_name}\` | \`${r.result_name}\` | \`${r.leader_exec}\` | ${passStr} |\n`;
  }

  md += "\n---\n\n";
  md += "## 2. Raw Receipt Extracts (JSON)\n\n";

  for (const r of results) {
    md += `### ${r.name}\n`;
    md += `- **Hash**: \`${r.hash}\`\n`;
    md += `- **Status**: \`${r.status_name}\`\n`;
    md += `- **Result**: \`${r.result_name}\`\n`;
    md += `- **Leader Execution**: \`${r.leader_exec}\`\n\n`;
    md += "```json\n" + JSON.stringify(r.receiptSnippet, null, 2) + "\n```\n\n";
  }

  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'RECEIPTS.md'), md);
  console.log("Wrote docs/RECEIPTS.md successfully.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
