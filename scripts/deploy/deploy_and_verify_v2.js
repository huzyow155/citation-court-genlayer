const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  console.log("=== STEP 4: CITATION COURT V2 DEPLOYMENT & ON-CHAIN VERIFICATION ===");

  const authorAccount = createAccount();
  const otherAccount = createAccount();
  console.log("Author / Deployer account address:", authorAccount.address);
  console.log("Other (non-author) account address:", otherAccount.address);

  const client = createClient({
    chain: chains.studionet,
    account: authorAccount,
  });

  const otherClient = createClient({
    chain: chains.studionet,
    account: otherAccount,
  });

  // Ensure docs/evidence_m1 directory exists
  const evidenceDir = path.join(__dirname, '../../docs/evidence_m1');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  // 1. Read local CitationCourtV2 code
  const codePath = path.join(__dirname, '../../contracts/CitationCourtV2.py');
  const localCode = fs.readFileSync(codePath, 'utf8');
  const localSha256 = crypto.createHash('sha256').update(localCode, 'utf8').digest('hex');
  console.log("Local CitationCourtV2 SHA-256:", localSha256);

  // 2. Deploy Contract
  console.log("\n[1/4] Deploying CitationCourtV2 to Studionet...");
  const t0Deploy = Date.now();
  const deployTxHash = await client.deployContract({
    code: localCode,
    args: [],
  });
  console.log("Deploy Tx Hash:", deployTxHash);

  const deployReceipt = await client.waitForTransactionReceipt({
    hash: deployTxHash,
    retries: 150,
    interval: 3000,
  });
  const deployElapsed = (Date.now() - t0Deploy) / 1000;
  console.log(`Deploy completed in ${deployElapsed.toFixed(2)}s`);
  console.log("Deploy status_name:", deployReceipt.status_name);
  console.log("Deploy result_name:", deployReceipt.result_name);
  const leaderExecResult = deployReceipt?.consensus_data?.leader_receipt?.[0]?.execution_result;
  console.log("Deploy leader execution_result:", leaderExecResult);

  const contractAddress = deployReceipt.recipient || deployReceipt?.data?.contract_address;
  console.log("Deployed CitationCourtV2 Contract Address:", contractAddress);

  if (!contractAddress) {
    throw new Error("No contract address returned from deployment receipt");
  }

  // Save deploy receipt
  const deployReceiptData = {
    contractAddress,
    deployTxHash,
    deployElapsed,
    status_name: deployReceipt.status_name,
    result_name: deployReceipt.result_name,
    leader_execution_result: leaderExecResult,
    raw_receipt: deployReceipt,
  };
  fs.writeFileSync(path.join(__dirname, 'v2_receipt.json'), JSON.stringify(deployReceipt, null, 2), 'utf8');
  fs.writeFileSync(path.join(evidenceDir, 'v2_deploy_receipt.json'), JSON.stringify(deployReceiptData, null, 2), 'utf8');

  // 3. Extract source from chain tx and verify diff
  console.log("\n[2/4] Verifying deployed source from deploy tx payload...");
  const deployTx = await client.getTransaction({ hash: deployTxHash });
  const base64Code = deployTx?.data?.contract_code;
  if (!base64Code) {
    throw new Error("contract_code missing from deploy transaction data");
  }
  const extractedCode = Buffer.from(base64Code, 'base64').toString('utf8');
  const extractedSha256 = crypto.createHash('sha256').update(extractedCode, 'utf8').digest('hex');

  const extractedPath = path.join(evidenceDir, 'v2_extracted_code.py');
  fs.writeFileSync(extractedPath, extractedCode, 'utf8');

  console.log("Extracted Source SHA-256:", extractedSha256);
  console.log("Local Source SHA-256:    ", localSha256);
  const isMatch = (localSha256 === extractedSha256) && (localCode === extractedCode);
  console.log("Byte-for-byte exact match:", isMatch);
  if (!isMatch) {
    throw new Error("STOP: Source diff is not empty! Deployed source code does not match local contract.");
  }

  // 4. Run scenarios (a) through (g)
  console.log("\n[3/4] Running Scenarios (a) through (g) on-chain...");

  const SUPPORTS_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md";
  const SUPPORTS2_URL = "https://cdn.jsdelivr.net/gh/huzyow155/citation-court-genlayer@63efe26/fixtures/supports2.md";
  const NEAR_MISS_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/near_miss.md";
  const SHORT_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/short.md";
  const INJECTION_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/injection.md";

  const CLAIM_REVENUE = "Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.";
  const CLAIM_MARGIN = "Project Nova achieved 100 percent net profit margins.";

  const latencies = {
    lodge: [],
    add_source: [],
    judge_source_llm: [],
    judge_source_unreadable: [],
  };

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

  const scenarioResults = {};

  // --- Scenario (a): S + S -> CORROBORATED ---
  console.log("\n--- Scenario (a): S + S -> CORROBORATED ---");
  const a_lodge = await executeWrite('lodge_claim', [CLAIM_REVENUE, SUPPORTS_URL], 'Scenario (a) Lodge', 'lodge');
  const a_cid = "1";
  const a_add = await executeWrite('add_source', [a_cid, SUPPORTS2_URL], 'Scenario (a) Add Source 1', 'add_source');
  const a_j0 = await executeWrite('judge_source', [a_cid, 0], 'Scenario (a) Judge Source 0 (SUPPORTS)', 'judge_source_llm');
  const a_j1 = await executeWrite('judge_source', [a_cid, 1], 'Scenario (a) Judge Source 1 (SUPPORTS)', 'judge_source_llm');
  const a_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [a_cid] });
  const a_is_corrob = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [a_cid, 2] });
  console.log("Scenario (a) corroboration:", a_corrob, "| is_corroborated(2):", a_is_corrob);
  scenarioResults.a = {
    scenario: "a",
    expected: "CORROBORATED",
    claim_id: a_cid,
    sources: [SUPPORTS_URL, SUPPORTS2_URL],
    txs: { lodge: a_lodge.txHash, add_source: a_add.txHash, judge_0: a_j0.txHash, judge_1: a_j1.txHash },
    triples: { lodge: a_lodge.triple, add_source: a_add.triple, judge_0: a_j0.triple, judge_1: a_j1.triple },
    corroboration: JSON.parse(a_corrob),
    is_corroborated: a_is_corrob,
  };

  // --- Scenario (b): S + C -> DISPUTED ---
  console.log("\n--- Scenario (b): S + C -> DISPUTED ---");
  const b_lodge = await executeWrite('lodge_claim', [CLAIM_REVENUE, SUPPORTS_URL], 'Scenario (b) Lodge', 'lodge');
  const b_cid = "2";
  const b_add = await executeWrite('add_source', [b_cid, NEAR_MISS_URL], 'Scenario (b) Add Source 1', 'add_source');
  const b_j0 = await executeWrite('judge_source', [b_cid, 0], 'Scenario (b) Judge Source 0 (SUPPORTS)', 'judge_source_llm');
  const b_j1 = await executeWrite('judge_source', [b_cid, 1], 'Scenario (b) Judge Source 1 (CONTRADICTS)', 'judge_source_llm');
  const b_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [b_cid] });
  const b_is_corrob = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [b_cid, 1] });
  console.log("Scenario (b) corroboration:", b_corrob, "| is_corroborated(1):", b_is_corrob);
  scenarioResults.b = {
    scenario: "b",
    expected: "DISPUTED",
    claim_id: b_cid,
    sources: [SUPPORTS_URL, NEAR_MISS_URL],
    txs: { lodge: b_lodge.txHash, add_source: b_add.txHash, judge_0: b_j0.txHash, judge_1: b_j1.txHash },
    triples: { lodge: b_lodge.triple, add_source: b_add.triple, judge_0: b_j0.triple, judge_1: b_j1.triple },
    corroboration: JSON.parse(b_corrob),
    is_corroborated: b_is_corrob,
  };

  // --- Scenario (c): S only -> SINGLE_SOURCE ---
  console.log("\n--- Scenario (c): S only -> SINGLE_SOURCE ---");
  const c_lodge = await executeWrite('lodge_claim', [CLAIM_REVENUE, SUPPORTS_URL], 'Scenario (c) Lodge', 'lodge');
  const c_cid = "3";
  const c_j0 = await executeWrite('judge_source', [c_cid, 0], 'Scenario (c) Judge Source 0 (SUPPORTS)', 'judge_source_llm');
  const c_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [c_cid] });
  const c_is_corrob1 = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [c_cid, 1] });
  const c_is_corrob2 = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [c_cid, 2] });
  console.log("Scenario (c) corroboration:", c_corrob, "| is_corroborated(1):", c_is_corrob1, "| is_corroborated(2):", c_is_corrob2);
  scenarioResults.c = {
    scenario: "c",
    expected: "SINGLE_SOURCE",
    claim_id: c_cid,
    sources: [SUPPORTS_URL],
    txs: { lodge: c_lodge.txHash, judge_0: c_j0.txHash },
    triples: { lodge: c_lodge.triple, judge_0: c_j0.triple },
    corroboration: JSON.parse(c_corrob),
    is_corroborated_1: c_is_corrob1,
    is_corroborated_2: c_is_corrob2,
  };

  // --- Scenario (d): C only -> CONTRADICTED ---
  console.log("\n--- Scenario (d): C only -> CONTRADICTED ---");
  const d_lodge = await executeWrite('lodge_claim', [CLAIM_REVENUE, NEAR_MISS_URL], 'Scenario (d) Lodge', 'lodge');
  const d_cid = "4";
  const d_j0 = await executeWrite('judge_source', [d_cid, 0], 'Scenario (d) Judge Source 0 (CONTRADICTS)', 'judge_source_llm');
  const d_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [d_cid] });
  const d_is_corrob = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [d_cid, 1] });
  console.log("Scenario (d) corroboration:", d_corrob, "| is_corroborated(1):", d_is_corrob);
  scenarioResults.d = {
    scenario: "d",
    expected: "CONTRADICTED",
    claim_id: d_cid,
    sources: [NEAR_MISS_URL],
    txs: { lodge: d_lodge.txHash, judge_0: d_j0.txHash },
    triples: { lodge: d_lodge.triple, judge_0: d_j0.triple },
    corroboration: JSON.parse(d_corrob),
    is_corroborated: d_is_corrob,
  };

  // --- Scenario (e): N + U -> UNSUPPORTED ---
  console.log("\n--- Scenario (e): N + U -> UNSUPPORTED ---");
  const e_lodge = await executeWrite('lodge_claim', [CLAIM_MARGIN, INJECTION_URL], 'Scenario (e) Lodge', 'lodge');
  const e_cid = "5";
  const e_add = await executeWrite('add_source', [e_cid, SHORT_URL], 'Scenario (e) Add Source 1 (short)', 'add_source');
  const e_j0 = await executeWrite('judge_source', [e_cid, 0], 'Scenario (e) Judge Source 0 (NOT_ADDRESSED)', 'judge_source_llm');
  const e_j1 = await executeWrite('judge_source', [e_cid, 1], 'Scenario (e) Judge Source 1 (UNREADABLE)', 'judge_source_unreadable');
  const e_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [e_cid] });
  const e_is_corrob = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [e_cid, 1] });
  console.log("Scenario (e) corroboration:", e_corrob, "| is_corroborated(1):", e_is_corrob);
  scenarioResults.e = {
    scenario: "e",
    expected: "UNSUPPORTED",
    claim_id: e_cid,
    sources: [INJECTION_URL, SHORT_URL],
    txs: { lodge: e_lodge.txHash, add_source: e_add.txHash, judge_0: e_j0.txHash, judge_1: e_j1.txHash },
    triples: { lodge: e_lodge.triple, add_source: e_add.triple, judge_0: e_j0.triple, judge_1: e_j1.triple },
    corroboration: JSON.parse(e_corrob),
    is_corroborated: e_is_corrob,
  };

  // --- Scenario (f): S + S + C -> DISPUTED ---
  console.log("\n--- Scenario (f): S + S + C -> DISPUTED ---");
  const f_lodge = await executeWrite('lodge_claim', [CLAIM_REVENUE, SUPPORTS_URL], 'Scenario (f) Lodge', 'lodge');
  const f_cid = "6";
  const f_add1 = await executeWrite('add_source', [f_cid, SUPPORTS2_URL], 'Scenario (f) Add Source 1', 'add_source');
  const f_add2 = await executeWrite('add_source', [f_cid, NEAR_MISS_URL], 'Scenario (f) Add Source 2', 'add_source');
  const f_j0 = await executeWrite('judge_source', [f_cid, 0], 'Scenario (f) Judge Source 0 (SUPPORTS)', 'judge_source_llm');
  const f_j1 = await executeWrite('judge_source', [f_cid, 1], 'Scenario (f) Judge Source 1 (SUPPORTS)', 'judge_source_llm');
  const f_j2 = await executeWrite('judge_source', [f_cid, 2], 'Scenario (f) Judge Source 2 (CONTRADICTS)', 'judge_source_llm');
  const f_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [f_cid] });
  const f_is_corrob = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [f_cid, 1] });
  console.log("Scenario (f) corroboration:", f_corrob, "| is_corroborated(1):", f_is_corrob);
  scenarioResults.f = {
    scenario: "f",
    expected: "DISPUTED",
    claim_id: f_cid,
    sources: [SUPPORTS_URL, SUPPORTS2_URL, NEAR_MISS_URL],
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

  // --- Scenario (g): Unjudged -> UNJUDGED ---
  console.log("\n--- Scenario (g): Unjudged -> UNJUDGED ---");
  const g_lodge = await executeWrite('lodge_claim', [CLAIM_REVENUE, SUPPORTS_URL], 'Scenario (g) Lodge', 'lodge');
  const g_cid = "7";
  const g_add = await executeWrite('add_source', [g_cid, SUPPORTS2_URL], 'Scenario (g) Add Source 1', 'add_source');
  const g_corrob = await client.readContract({ address: contractAddress, functionName: 'get_corroboration', args: [g_cid] });
  const g_is_corrob = await client.readContract({ address: contractAddress, functionName: 'is_corroborated', args: [g_cid, 1] });
  console.log("Scenario (g) corroboration:", g_corrob, "| is_corroborated(1):", g_is_corrob);
  scenarioResults.g = {
    scenario: "g",
    expected: "UNJUDGED",
    claim_id: g_cid,
    sources: [SUPPORTS_URL, SUPPORTS2_URL],
    txs: { lodge: g_lodge.txHash, add_source: g_add.txHash },
    triples: { lodge: g_lodge.triple, add_source: g_add.triple },
    corroboration: JSON.parse(g_corrob),
    is_corroborated: g_is_corrob,
  };

  fs.writeFileSync(path.join(evidenceDir, 'scenarios_raw.json'), JSON.stringify(scenarioResults, null, 2), 'utf8');

  // 5. Test Refusal and User Error Cases
  console.log("\n[4/4] Executing on-chain Refusal / User Error tests...");
  const refusalResults = {};

  async function testRefusal(name, clientToUse, fnName, args, expectedError) {
    console.log(`  -> Testing refusal: ${name}...`);
    let txHash = null;
    let receipt = null;
    let errorCaught = null;
    try {
      txHash = await clientToUse.writeContract({
        address: contractAddress,
        functionName: fnName,
        args: args,
      });
      receipt = await clientToUse.waitForTransactionReceipt({
        hash: txHash,
        retries: 150,
        interval: 3000,
      });
      const leaderReceipt = receipt?.consensus_data?.leader_receipt?.[0];
      const errorDesc = leaderReceipt?.genvm_result?.error_description || leaderReceipt?.genvm_result?.raw_error || '';
      console.log(`     On-chain receipt: status=${receipt.status_name}, result=${receipt.result_name}, error=${errorDesc}`);
      refusalResults[name] = {
        name,
        expectedError,
        txHash,
        status_name: receipt.status_name,
        result_name: receipt.result_name,
        execution_result: leaderReceipt?.execution_result,
        error_description: errorDesc,
        raw_receipt: receipt,
      };
    } catch (err) {
      console.log(`     Client threw error: ${err.message}`);
      errorCaught = err.message;
      refusalResults[name] = {
        name,
        expectedError,
        client_error: errorCaught,
      };
    }
  }

  // Refusal 1: 4th source on claim 6 (already has 3 sources)
  await testRefusal(
    'source_limit_reached',
    client,
    'add_source',
    ['6', 'https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/short.md'],
    'source limit reached'
  );

  // Refusal 2: Duplicate source on claim 6 (adding supports2 again with trailing slash)
  await testRefusal(
    'duplicate_source',
    client,
    'add_source',
    ['6', 'https://cdn.jsdelivr.net/gh/huzyow155/citation-court-genlayer@63efe26/fixtures/supports2.md/'],
    'duplicate source'
  );

  // Refusal 3: Non-author add_source on claim 6
  await testRefusal(
    'only_claim_author_can_add_sources',
    otherClient,
    'add_source',
    ['6', 'https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/injection.md'],
    'only the claim author can add sources'
  );

  // Refusal 4: Re-judging an already judged source (index 0 on claim 6)
  await testRefusal(
    'claim_already_judged',
    client,
    'judge_source',
    ['6', 0],
    'claim already judged'
  );

  fs.writeFileSync(path.join(evidenceDir, 'refusals_raw.json'), JSON.stringify(refusalResults, null, 2), 'utf8');
  fs.writeFileSync(path.join(evidenceDir, 'latencies.json'), JSON.stringify(latencies, null, 2), 'utf8');

  console.log("\n=== CITATION COURT V2 DEPLOYMENT & ON-CHAIN VERIFICATION COMPLETED SUCCESSFULLY ===");
}

main().catch(err => {
  console.error("FATAL ERROR in deploy_and_verify_v2:", err);
  process.exit(1);
});
