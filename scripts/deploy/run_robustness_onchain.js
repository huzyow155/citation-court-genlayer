const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=== EXECUTING ON-CHAIN ROBUSTNESS TRIALS (10 RUNS) ===");
  const contractAddress = "0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe";
  const SUPPORTS2_URL = "https://cdn.jsdelivr.net/gh/huzyow155/citation-court-genlayer@63efe26/fixtures/supports2.md";
  const CLAIM_TEXT = "Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.";

  const outDir = path.join(__dirname, '../../docs/evidence_m1/robustness_supports2');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const account = createAccount();
  console.log("Runner Account Address:", account.address);
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const statsRaw = await client.readContract({ address: contractAddress, functionName: 'get_stats', args: [] });
  console.log("Initial contract stats:", statsRaw);

  for (let i = 1; i <= 10; i++) {
    const runPad = String(i).padStart(2, '0');
    const runFile = path.join(outDir, `run_${runPad}.json`);

    // Check if run already exists (resumable)
    if (fs.existsSync(runFile)) {
      console.log(`\nRun ${runPad} already exists at ${runFile}, skipping.`);
      continue;
    }

    console.log(`\n----------------------------------------`);
    console.log(`Starting Robustness Trial ${runPad}/10...`);
    console.log(`----------------------------------------`);

    // 1. Lodge claim
    console.log(`  -> Submitting lodge_claim...`);
    const t0Lodge = Date.now();
    const lodgeTx = await client.writeContract({
      address: contractAddress,
      functionName: 'lodge_claim',
      args: [CLAIM_TEXT, SUPPORTS2_URL],
    });
    const lodgeReceipt = await client.waitForTransactionReceipt({
      hash: lodgeTx,
      retries: 150,
      interval: 3000,
    });
    const lodgeElapsed = (Date.now() - t0Lodge) / 1000;
    const lodgeTriple = {
      status_name: lodgeReceipt.status_name,
      result_name: lodgeReceipt.result_name,
      execution_result: lodgeReceipt?.consensus_data?.leader_receipt?.[0]?.execution_result || 'UNKNOWN',
    };
    console.log(`     Lodge confirmed in ${lodgeElapsed.toFixed(2)}s | Tx: ${lodgeTx}`);
    console.log(`     Triple: status=${lodgeTriple.status_name}, result=${lodgeTriple.result_name}, exec=${lodgeTriple.execution_result}`);

    await sleep(4000);

    // Get claim ID
    const currentStats = JSON.parse(await client.readContract({ address: contractAddress, functionName: 'get_stats', args: [] }));
    const claimId = String(currentStats.total_claims);
    console.log(`     Assigned Claim ID: ${claimId}`);

    // 2. Judge source 0
    console.log(`  -> Submitting judge_source(${claimId}, 0)...`);
    const t0Judge = Date.now();
    const judgeTx = await client.writeContract({
      address: contractAddress,
      functionName: 'judge_source',
      args: [claimId, 0],
    });
    const judgeReceipt = await client.waitForTransactionReceipt({
      hash: judgeTx,
      retries: 150,
      interval: 3000,
    });
    const judgeElapsed = (Date.now() - t0Judge) / 1000;
    const judgeTriple = {
      status_name: judgeReceipt.status_name,
      result_name: judgeReceipt.result_name,
      execution_result: judgeReceipt?.consensus_data?.leader_receipt?.[0]?.execution_result || 'UNKNOWN',
    };
    console.log(`     Judge confirmed in ${judgeElapsed.toFixed(2)}s | Tx: ${judgeTx}`);
    console.log(`     Triple: status=${judgeTriple.status_name}, result=${judgeTriple.result_name}, exec=${judgeTriple.execution_result}`);

    await sleep(4000);

    // Read rulings
    const rulingRaw = await client.readContract({
      address: contractAddress,
      functionName: 'get_source_ruling',
      args: [claimId, 0],
    });
    const corroborationRaw = await client.readContract({
      address: contractAddress,
      functionName: 'get_corroboration',
      args: [claimId],
    });

    console.log(`     Recorded Ruling:`, rulingRaw);
    console.log(`     Recorded Corroboration:`, corroborationRaw);

    const ruling = JSON.parse(rulingRaw);
    const corroboration = JSON.parse(corroborationRaw);

    const runData = {
      run_index: i,
      run_id: `run_${runPad}`,
      contract_address: contractAddress,
      claim_id: claimId,
      claim_text: CLAIM_TEXT,
      source_url: SUPPORTS2_URL,
      expected_verdict: "SUPPORTS",
      recorded_verdict: ruling.verdict,
      verdict_match: ruling.verdict === "SUPPORTS",
      timings: {
        lodge_seconds: lodgeElapsed,
        judge_seconds: judgeElapsed,
      },
      lodge: {
        tx_hash: lodgeTx,
        status_name: lodgeTriple.status_name,
        result_name: lodgeTriple.result_name,
        execution_result: lodgeTriple.execution_result,
        raw_receipt: lodgeReceipt,
      },
      judge: {
        tx_hash: judgeTx,
        status_name: judgeTriple.status_name,
        result_name: judgeTriple.result_name,
        execution_result: judgeTriple.execution_result,
        raw_receipt: judgeReceipt,
      },
      ruling: ruling,
      corroboration: corroboration,
    };

    fs.writeFileSync(runFile, JSON.stringify(runData, null, 2), 'utf8');
    console.log(`     Saved Run ${runPad} to ${runFile}`);

    // Wait before next run
    if (i < 10) {
      console.log(`     Sleeping 5s before next trial...`);
      await sleep(5000);
    }
  }

  console.log("\n=== ALL 10 ROBUSTNESS TRIALS COMPLETED ===");
}

main().catch(err => {
  console.error("Error in run_robustness_onchain:", err);
  process.exit(1);
});
