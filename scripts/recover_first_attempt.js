const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=== RECOVERING FIRST ATTEMPT (NEAR_MISS) EVIDENCE ===");
  const contractAddress = "0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe";
  const account = createAccount();
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const txData = {
    claim_2: {
      scenario: "b_first_attempt",
      claim_id: "2",
      description: "Scenario (b) first attempt with near_miss.md yielding NOT_ADDRESSED",
      txs: {
        lodge: "0x84c5c40b9383ca2d12d4ffc694a05ea8166831707d40e37b47c98f558e5f824a",
        add_source: "0x82d43165597a14913d4d90b2ae51eb7d54fd6788ddbabef445b6d0e02701f019",
        judge_0: "0xa3b0733030e533af1ac24b0c56907f78bcac1a120ad10ade0ef2b08661435012",
        judge_1: "0x250140adb63c6e22bb3436fd39a5dd3ee7c1b4ba53c35ce24337a164cb68cdc5",
      }
    },
    claim_4: {
      scenario: "d_first_attempt",
      claim_id: "4",
      description: "Scenario (d) first attempt with near_miss.md yielding NOT_ADDRESSED",
      txs: {
        lodge: "0x0e00a8447b0a75315fa46fb8f8891829be1aa8184241d6b270b23bd9d7576512",
        judge_0: "0x5c723aeb2f4f1c98bd7d08d578311438a65f8dec332418d7175eeda8457c74e8",
      }
    },
    claim_6: {
      scenario: "f_first_attempt",
      claim_id: "6",
      description: "Scenario (f) first attempt with near_miss.md yielding NOT_ADDRESSED",
      txs: {
        lodge: "0x547d9658f558c0a2bdcca3a9eef6ac9ac0878c7b5d058c671560f7175e543ff2",
        add_source_1: "0x79d0468ec4926d02de4d56a1d97c644a0d3d00af3186bfa5f137bd5a0a2cb56b",
        add_source_2: "0x636316837ec0f0ebe9b9423323aa88724583441df2812cb9f73914d72f417b6d",
        judge_0: "0x0dec28f3290571a17f0f544c5ce624e581b32db8ead8a8ae3b3535914998e3e4",
        judge_1: "0x3875a3d793a9169d0bf01ddb4819f7ed482c5b4d823dba5dd50331eb9b7b2eb5",
        judge_2: "0x8315d7f6465e6f5fef8662c96df921d8b852ef3a60e67a795f018473d3449714",
      }
    }
  };

  const result = {
    contract_address: contractAddress,
    retrieved_at: new Date().toISOString(),
    attempts: {}
  };

  for (const [key, item] of Object.entries(txData)) {
    console.log(`\nFetching on-chain state for Claim ${item.claim_id} (${item.scenario})...`);
    const claimRaw = await client.readContract({ address: contractAddress, functionName: 'get_claim', args: [item.claim_id] });
    const corrobRaw = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [item.claim_id] });
    await sleep(1000);

    const receipts = {};
    const triples = {};
    for (const [txLabel, txHash] of Object.entries(item.txs)) {
      console.log(`  -> Fetching receipt for ${txLabel} (${txHash})...`);
      const receipt = await client.waitForTransactionReceipt({ hash: txHash, retries: 10, interval: 1000 });
      receipts[txLabel] = receipt;
      triples[txLabel] = {
        status_name: receipt.status_name,
        result_name: receipt.result_name,
        execution_result: receipt?.consensus_data?.leader_receipt?.[0]?.execution_result || 'UNKNOWN',
      };
      await sleep(1000);
    }

    result.attempts[key] = {
      scenario: item.scenario,
      claim_id: item.claim_id,
      description: item.description,
      claim_data: JSON.parse(claimRaw),
      corroboration: JSON.parse(corrobRaw),
      tx_hashes: item.txs,
      triples: triples,
      raw_receipts: receipts,
    };
  }

  const outPath = path.join(__dirname, '../docs/evidence_m1/first_attempt_near_miss.json');
  const replacer = (key, value) => typeof value === 'bigint' ? value.toString() : value;
  fs.writeFileSync(outPath, JSON.stringify(result, replacer, 2), 'utf8');
  console.log(`\nSaved first attempt evidence to ${outPath}`);
}

main().catch(err => {
  console.error("Error in recover_first_attempt:", err);
  process.exit(1);
});
