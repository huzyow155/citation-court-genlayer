const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const authorAccount = createAccount();
  console.log("Scenario Runner Account:", authorAccount.address);

  const client = createClient({
    chain: chains.studionet,
    account: authorAccount,
  });

  const evidenceDir = path.join(__dirname, '../../docs/evidence_m1');
  const deployReceipt = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'v2_deploy_receipt.json'), 'utf8'));
  const contractAddress = deployReceipt.contractAddress;
  console.log("Target CitationCourtV2 Contract Address:", contractAddress);

  const scenariosPath = path.join(evidenceDir, 'scenarios_raw.json');
  const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));
  const latenciesPath = path.join(evidenceDir, 'latencies.json');
  const latencies = JSON.parse(fs.readFileSync(latenciesPath, 'utf8'));

  const SUPPORTS_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md";
  const SUPPORTS2_URL = "https://cdn.jsdelivr.net/gh/huzyow155/citation-court-genlayer@63efe26/fixtures/supports2.md";
  const CONTRADICTS_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/contradicts.md";
  const CLAIM_REVENUE = "Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.";

  async function executeWrite(fnName, args, label, latencyCategory) {
    console.log(`  -> Submitting ${fnName}(${args.map(a => JSON.stringify(a)).join(', ')}) [${label}]...`);
    const t0 = Date.now();
    const txHash = await client.writeContract({
      address: contractAddress,
      functionName: fnName,
      args: args,
    });
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      retries: 150,
      interval: 3000,
    });
    const elapsed = (Date.now() - t0) / 1000;
    const triple = {
      status_name: receipt.status_name,
      result_name: receipt.result_name,
      execution_result: receipt?.consensus_data?.leader_receipt?.[0]?.execution_result || 'UNKNOWN',
    };
    console.log(`     Confirmed in ${elapsed.toFixed(2)}s | status: ${triple.status_name} | result: ${triple.result_name} | exec: ${triple.execution_result}`);
    if (latencyCategory && latencies[latencyCategory]) {
      latencies[latencyCategory].push({ fn: fnName, label, elapsed, txHash });
    }
    return { txHash, receipt, elapsed, triple };
  }

  // --- Scenario (b): S + C -> DISPUTED ---
  console.log("\n--- Executing Scenario (b): S + C -> DISPUTED ---");
  const b_lodge = await executeWrite('lodge_claim', [CLAIM_REVENUE, SUPPORTS_URL], 'Scenario (b) Lodge', 'lodge');
  const b_stats = JSON.parse(await client.readContract({ address: contractAddress, functionName: 'get_stats', args: [] }));
  const b_cid = String(b_stats.total_claims);
  console.log("Scenario (b) Claim ID:", b_cid);

  const b_add = await executeWrite('add_source', [b_cid, CONTRADICTS_URL], 'Scenario (b) Add Source 1 (contradicts)', 'add_source');
  const b_j0 = await executeWrite('judge_source', [b_cid, 0], 'Scenario (b) Judge Source 0 (SUPPORTS)', 'judge_source_llm');
  const b_j1 = await executeWrite('judge_source', [b_cid, 1], 'Scenario (b) Judge Source 1 (CONTRADICTS)', 'judge_source_llm');

  const b_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [b_cid] });
  const b_is_corrob = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [b_cid, 1] });
  console.log("Scenario (b) corroboration:", b_corrob, "| is_corroborated(1):", b_is_corrob);
  scenarios.b = {
    scenario: "b",
    expected: "DISPUTED",
    claim_id: b_cid,
    sources: [SUPPORTS_URL, CONTRADICTS_URL],
    txs: { lodge: b_lodge.txHash, add_source: b_add.txHash, judge_0: b_j0.txHash, judge_1: b_j1.txHash },
    triples: { lodge: b_lodge.triple, add_source: b_add.triple, judge_0: b_j0.triple, judge_1: b_j1.triple },
    corroboration: JSON.parse(b_corrob),
    is_corroborated: b_is_corrob,
  };

  // --- Scenario (d): C only -> CONTRADICTED ---
  console.log("\n--- Executing Scenario (d): C only -> CONTRADICTED ---");
  const d_lodge = await executeWrite('lodge_claim', [CLAIM_REVENUE, CONTRADICTS_URL], 'Scenario (d) Lodge', 'lodge');
  const d_stats = JSON.parse(await client.readContract({ address: contractAddress, functionName: 'get_stats', args: [] }));
  const d_cid = String(d_stats.total_claims);
  console.log("Scenario (d) Claim ID:", d_cid);

  const d_j0 = await executeWrite('judge_source', [d_cid, 0], 'Scenario (d) Judge Source 0 (CONTRADICTS)', 'judge_source_llm');
  const d_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [d_cid] });
  const d_is_corrob = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [d_cid, 1] });
  console.log("Scenario (d) corroboration:", d_corrob, "| is_corroborated(1):", d_is_corrob);
  scenarios.d = {
    scenario: "d",
    expected: "CONTRADICTED",
    claim_id: d_cid,
    sources: [CONTRADICTS_URL],
    txs: { lodge: d_lodge.txHash, judge_0: d_j0.txHash },
    triples: { lodge: d_lodge.triple, judge_0: d_j0.triple },
    corroboration: JSON.parse(d_corrob),
    is_corroborated: d_is_corrob,
  };

  // --- Scenario (f): S + S + C -> DISPUTED ---
  console.log("\n--- Executing Scenario (f): S + S + C -> DISPUTED ---");
  const f_lodge = await executeWrite('lodge_claim', [CLAIM_REVENUE, SUPPORTS_URL], 'Scenario (f) Lodge', 'lodge');
  const f_stats = JSON.parse(await client.readContract({ address: contractAddress, functionName: 'get_stats', args: [] }));
  const f_cid = String(f_stats.total_claims);
  console.log("Scenario (f) Claim ID:", f_cid);

  const f_add1 = await executeWrite('add_source', [f_cid, SUPPORTS2_URL], 'Scenario (f) Add Source 1 (supports2)', 'add_source');
  const f_add2 = await executeWrite('add_source', [f_cid, CONTRADICTS_URL], 'Scenario (f) Add Source 2 (contradicts)', 'add_source');
  const f_j0 = await executeWrite('judge_source', [f_cid, 0], 'Scenario (f) Judge Source 0 (SUPPORTS)', 'judge_source_llm');
  const f_j1 = await executeWrite('judge_source', [f_cid, 1], 'Scenario (f) Judge Source 1 (SUPPORTS)', 'judge_source_llm');
  const f_j2 = await executeWrite('judge_source', [f_cid, 2], 'Scenario (f) Judge Source 2 (CONTRADICTS)', 'judge_source_llm');

  const f_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [f_cid] });
  const f_is_corrob = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [f_cid, 1] });
  console.log("Scenario (f) corroboration:", f_corrob, "| is_corroborated(1):", f_is_corrob);
  scenarios.f = {
    scenario: "f",
    expected: "DISPUTED",
    claim_id: f_cid,
    sources: [SUPPORTS_URL, SUPPORTS2_URL, CONTRADICTS_URL],
    txs: {
      lodge: f_lodge.txHash,
      add_source_1: f_add1.txHash,
      add_source_2: f_add2.txHash,
      judge_0: f_j0.txHash,
      judge_1: f_j1.txHash,
      judge_2: f_j2.txHash,
    },
    triples: {
      lodge: f_lodge.triple,
      add_source_1: f_add1.triple,
      add_source_2: f_add2.triple,
      judge_0: f_j0.triple,
      judge_1: f_j1.triple,
      judge_2: f_j2.triple,
    },
    corroboration: JSON.parse(f_corrob),
    is_corroborated: f_is_corrob,
  };

  fs.writeFileSync(scenariosPath, JSON.stringify(scenarios, null, 2), 'utf8');
  fs.writeFileSync(latenciesPath, JSON.stringify(latencies, null, 2), 'utf8');

  console.log("\nScenarios (b), (d), (f) updated successfully with contradicts fixture!");
}

main().catch(err => {
  console.error("Error in run_scenarios_b_d_f:", err);
  process.exit(1);
});
