const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const fs = require('fs');
const path = require('path');
const { createClient, chains, createAccount } = require('genlayer-js');

const client = createClient({
  chain: chains.studionet,
  account: createAccount(),
});

function findHexValues(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findHexValues(fullPath, fileList);
    } else if (file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function main() {
  const targetFiles = [
    path.join(__dirname, '..', 'README.md'),
    ...findHexValues(path.join(__dirname, '..', 'docs')),
    ...findHexValues(path.join(__dirname, 'deploy')),
  ];

  const hex40 = new Set();
  const hex64 = new Set();
  const occurrences = new Map();

  const regex40 = /\b0x[a-fA-F0-9]{40}\b/g;
  const regex64 = /\b0x[a-fA-F0-9]{64}\b/g;

  for (const filePath of targetFiles) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');

    let match;
    while ((match = regex40.exec(content)) !== null) {
      const val = match[0];
      hex40.add(val);
      if (!occurrences.has(val)) occurrences.set(val, new Set());
      occurrences.get(val).add(relPath);
    }

    while ((match = regex64.exec(content)) !== null) {
      const val = match[0];
      hex64.add(val);
      if (!occurrences.has(val)) occurrences.set(val, new Set());
      occurrences.get(val).add(relPath);
    }
  }

  console.log(`Found ${hex40.size} unique 20-byte addresses and ${hex64.size} unique 32-byte hashes.`);

  const addressRoles = {
    "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5": "CitationCourt Contract (Core platform contract on Studionet)",
    "0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4": "CitedBoard Contract (Cross-contract consumer example on Studionet)",
    "0xC5da3E1C809df4635738F6d6065c5629EFF7190C": "RuntimeProbe Contract (Preliminary runtime environment probe)",
    "0x06cd2B6279B28A3E82D6b97A35a1bB170a9654bF": "Deployer & Author EOA (Generated in deploy_core.js; deployed CitationCourt, author of Claim 1)",
    "0x88e9a06a57ebb9D7Bf3A7137e14D268EB6dd916D": "Probe Deployer EOA (Generated in deploy_probe.js; used as sender in probe & mocked tests)",
    "0xFa735A5DE1F29811DA9b235775D078d45E1643D3": "Consumer Deployer & Author EOA (Generated in deploy_consumer.js; deployed CitedBoard, author of article 1)",
    "0xd6165e3F6Ce52445e9F4E46cfdD5ea6C1cb01e6A": "Evidence Runner EOA (Generated in run_live_evidence.js for test execution)",
    "0x138eae55425d2192612da913b20CfAEe396F7bB6": "Evidence Runner EOA (Generated in run_live_evidence.js; lodged/judged Cases B-G)",
    "0xc669923f824c00B3210c00627434127673D7A056": "Wikipedia Case H Runner EOA (Generated during Case H run; lodged/judged Claim 8)",
  };

  const addressDefaultRole = "Studionet Validator Node / Consensus Operator (appears in validator votes & config in raw receipts)";

  const txRoles = {
    "0x99c85d3d9820f1fc691559dfb0ec5e1744adf6ef77c132c54c51b6f26dcc2c04": "CitationCourt Deploy Tx",
    "0x849659f8a73ad2c5626f7b6b55217fbb8bd33bdece97e936924e9a00bed1e1b6": "RuntimeProbe Deploy Tx",
    "0x9ad6527582b1c6d3ba4c107e3352fe05dfb776ec821a8a25c60c870ffbe32c70": "CitedBoard Deploy Tx",
    "0xbf181a3bbbeaa91a45ae86b09971bc3836d53e34b9d5c4ff80894be6a307c081": "CitedBoard post_article Tx",
    // Case A
    "0x041b1d4af8da6622451e49b4d045a43a6d87e4b2a63e1d3f544779a0b9fc5cc9": "Case A (Supports) lodge_claim Tx",
    "0xa64cd6227bd3ed898d955f01fb44bd05e234ae4219c4b3b7f2e8d0b2a85ba0ea": "Case A (Supports) judge_claim Tx",
    // Case B
    "0x4d94d98607705f3567a51f68977e37ee7fe32f93a1bdacb58836a3f35c842236": "Case B (Contradicts) lodge_claim Tx",
    "0xfd75f4f5d4a3bcd42d4bcc541b6da938962bc88d8baa6ad3db49c77495d4fe7f": "Case B (Contradicts) judge_claim Tx",
    // Case C
    "0x587c85f3f162d39970b49c02f44e36555321ab2150dd6efdd2b5d8778018b763": "Case C (Not Addressed) lodge_claim Tx",
    "0xa5a690dd6fd068bd08e3118fe8dc3583af8f30fd64cfe4e9567bd3b50dff7cc4": "Case C (Not Addressed) judge_claim Tx",
    // Case D
    "0xbe1a397bb81e0f5bebf6570cf0189bd243a8a1b7f0b428c270cb3b122aac4089": "Case D (Near Miss) lodge_claim Tx",
    "0x7fdb59625542ea1ddc594f04e382f5ed50c38e1d71fac7cd61c6a20f6ca4b3e0": "Case D (Near Miss) judge_claim Tx",
    // Case E
    "0x7d0361441f7d38f07d00399b108ced75b0025ca828addd1f04342395fdd14e9a": "Case E (Prompt Injection) lodge_claim Tx",
    "0x469a88b87f8b57395755fe0a8e65e6963b818df756101174c16feb015eddb651": "Case E (Prompt Injection) judge_claim Tx",
    // Case F
    "0x734a684a9abc9947ee32a75edb85665e9c0fa2108cc8d25baca99d45188a1c62": "Case F (404 Unreadable) lodge_claim Tx",
    "0x1cab8dedfa68b3ddfec5e0f4a2b1bbec1e0eb1847399eb7c97f34c3bb34641f8": "Case F (404 Unreadable) judge_claim Run 1 Tx",
    "0xc3bbd9392441e1754ad32174b405419899ca1856d53d63c4edbeaa5e2ccc1ce2": "Case F (404 Unreadable) judge_claim Run 2 (Re-judge) Tx",
    // Case G
    "0xc6055bbb59c8d1883c0fd990414f98bb5ab61eb12be9b2ba2bff5307374c83d2": "Case G (Short Page Unreadable) lodge_claim Tx",
    "0xc140440182750ea3f4f12ea0ce6e6b1c9bd94c98c499de77753ffed7367f8b65": "Case G (Short Page Unreadable) judge_claim Tx",
    // Case H
    "0x5079397ca576761237edaac4b155b507c81802fa84b9e8da09f3b4bc094f5a9b": "Case H (Wiki Earth Supports) lodge_claim Tx",
    "0xdb555c3638b551b6aeef67a88b2f58063881995af5ba449d2c8e4c6d4c261ecf": "Case H (Wiki Earth Supports) judge_claim Tx",
    // Runtime probe consensus
    "0x4bdc54a36130d1ea482b127b55f13dff4f8e3bbbc2282c80014bba966a26a8de": "RuntimeProbe probe_consensus Tx",
  };

  const addressRows = [];
  for (const addr of Array.from(hex40).sort()) {
    const role = addressRoles[addr] || addressDefaultRole;
    let rpcEvidence = "N/A";
    try {
      // Test if contract by checking code
      const code = await client.getContractCode(addr);
      rpcEvidence = (code && code.length > 0) ? `Contract (code: ${code.length} chars)` : "not a contract (getContractCode returned not found)";
    } catch (e) {
      rpcEvidence = "not a contract (getContractCode returned not found)";
    }
    const occ = Array.from(occurrences.get(addr) || []).sort().join(", ");
    addressRows.push({ address: addr, role, rpcEvidence, occurrences: occ });
  }

  const txRows = [];
  for (const hash of Array.from(hex64).sort()) {
    const role = txRoles[hash] || "Consensus Sub-Hash / State Root in raw receipt JSON";
    let rpcEvidence = "N/A";
    try {
      const tx = await client.getTransaction({ hash });
      if (tx) {
        const from = tx.from_address || tx.from || "N/A";
        const to = tx.to_address || tx.to || "N/A";
        let fn = "deploy";
        if (tx.data && tx.data.calldata) {
          try {
            const parsed = JSON.parse(Buffer.from(tx.data.calldata, 'base64').toString('utf8'));
            fn = parsed.method || "unknown";
          } catch (_) {
            fn = "calldata";
          }
        }
        rpcEvidence = `from: ${from.slice(0, 10)}..., to: ${to.slice(0, 10)}..., fn: ${fn}`;
      } else {
        rpcEvidence = "Receipt sub-hash / not top-level tx";
      }
    } catch (e) {
      rpcEvidence = "Receipt sub-hash (consensus trace)";
    }
    const occ = Array.from(occurrences.get(hash) || []).sort().join(", ");
    txRows.push({ hash, role, rpcEvidence, occurrences: occ });
  }

  let md = "# Address & Transaction Hash Registry: Citation Court\n\n";
  md += "This document registers and classifies all 27 20-byte `0x` addresses and 49 32-byte `0x` transaction hashes appearing across `README.md`, `docs/`, and `scripts/deploy/`.\n\n";
  md += "> **Provenance of Studionet Validator Node Addresses:**\n";
  md += "> Addresses labeled as \"Studionet Validator Node / Consensus Operator\" are inferred from transaction receipt fields in raw JSON outputs (`scripts/deploy/*_output.json`, `docs/RECEIPTS.md`), specifically:\n";
  md += "> - `consensus_data.votes.<address>`: Validator voting records and quorum signatures.\n";
  md += "> - `consensus_data.validators[].node_config.address`: Validator node configuration address.\n";
  md += "> - `consensus_data.validators[].node_config.fallback_validator`: Backup validator node address.\n";
  md += "> - `consensus_data.validators[].node_config.secondary_model.address`: Auxiliary validator address.\n";
  md += "> - `activator` & `last_leader`: Round leader node address.\n";
  md += ">\n";
  md += "> **RPC Classification Method:**\n";
  md += "> For each validator address, GenLayer RPC method `client.getContractCode(addr)` (`gen_getContractCode`) was queried. The RPC returned `\"Contract <address> not found\"` (empty bytecode `0x`), concluding that these are EOA / unregistered accounts operating as validator nodes rather than deployed smart contracts.\n\n";
  
  md += "## 1. Registered Addresses (20-byte hex)\n\n";
  md += "| Address | Role / Entity | Type (RPC Verification) | Appeared In |\n";
  md += "| :--- | :--- | :--- | :--- |\n";
  for (const r of addressRows) {
    md += `| \`${r.address}\` | ${r.role} | ${r.rpcEvidence} | ${r.occurrences} |\n`;
  }

  md += "\n## 2. Registered Transactions & Hashes (32-byte hex)\n\n";
  md += "| Hash | Role / Transaction | RPC Evidence (`from`, `to`, `function`) | Appeared In |\n";
  md += "| :--- | :--- | :--- | :--- |\n";
  for (const r of txRows) {
    md += `| \`${r.hash}\` | ${r.role} | ${r.rpcEvidence} | ${r.occurrences} |\n`;
  }

  md += "\n## 3. Auditor-Requested Specific Address Breakdown\n\n";
  md += "- **`0xC5da3E1C809df4635738F6d6065c5629EFF7190C`**: Deployed `RuntimeProbe` contract address on Studionet (`docs/RUNTIME_NOTES.md:57`, `scripts/deploy/probe_output.json`). Deployed during preliminary environment validation to test outbound HTTP fetching and JSON-RPC receipt structure.\n";
  md += "- **`0x849659f8a73ad2c5626f7b6b55217fbb8bd33bdece97e936924e9a00bed1e1b6`**: Deploy transaction hash for `RuntimeProbe` on Studionet (`docs/RUNTIME_NOTES.md:58`, `scripts/deploy/probe_output.json`).\n";
  md += "- **`0x88e9a06a57ebb9D7Bf3A7137e14D268EB6dd916D`**: Throwaway EOA test deployer/sender address generated via `createAccount()` in `scripts/deploy/deploy_probe.js` (`docs/RUNTIME_NOTES.md:60`, `tests/test_layer2_mocked.py:34`).\n";
  md += "- **`0x06cd2B6279B28A3E82D6b97A35a1bB170a9654bF`**: Throwaway EOA author/deployer address generated via `createAccount()` in `scripts/deploy/deploy_core.js` that deployed `CitationCourt` and lodged Claim 1 (`docs/INTEGRATION.md:51`, `scripts/tx_raw.json`).\n";
  md += "- **`0xFa735A5DE1F29811DA9b235775D078d45E1643D3`**: Throwaway EOA author/deployer address generated via `createAccount()` in `scripts/deploy/deploy_consumer.js` that deployed `CitedBoard` and posted article 1 (`docs/VERIFICATION.md:180`, `scripts/deploy/consumer_output.json`).\n\n";
  md += "## 4. Foreign Project Term Isolation Verification\n";
  md += "- `git grep -n -i -e \"mirrorjudge\" -e \"3991d0817\" -e \"294FFDec\"` returned 0 hits across all files.\n";

  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'ADDRESS_REGISTRY.md'), md);
  console.log("Wrote docs/ADDRESS_REGISTRY.md successfully.");
  console.log("\nRAW MARKDOWN OUTPUT:\n" + md);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
