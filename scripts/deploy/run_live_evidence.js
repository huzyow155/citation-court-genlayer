const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

const SUPPORTS_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md";
const NEAR_MISS_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/near_miss.md";
const INJECTION_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/injection.md";
const SHORT_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/short.md";
const NOT_FOUND_URL = "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/nonexistent_404.md";
const WIKIPEDIA_URL = "https://en.wikipedia.org/wiki/Special:Random";

async function main() {
  const coreOutputPath = path.join(__dirname, 'core_output.json');
  const coreData = JSON.parse(fs.readFileSync(coreOutputPath, 'utf8'));
  const contractAddress = coreData.contractAddress;

  const account = createAccount();
  console.log("Using evidence test account:", account.address);
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  console.log("Connected to CitationCourt contract at:", contractAddress);

  const evidenceRecords = [];

  // Case (a): SUPPORTS already verified in core deploy (Claim 1)
  evidenceRecords.push({
    case_name: "case_a_supports",
    description: "Clearly supported claim against supports.md with verified verbatim quote",
    claim_id: "1",
    claim_text: "Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.",
    url: SUPPORTS_URL,
    lodge_tx: coreData.lodgeTx1,
    judge_tx: coreData.judgeTx1,
    judge_status: coreData.judgeReceipt1.status_name,
    judge_result: coreData.judgeReceipt1.result_name,
    expected_verdict: "SUPPORTS",
    recorded_verdict: coreData.ruling1.verdict,
    attempts: coreData.ruling1.attempts,
    latency_sec: coreData.judgeLatencySec,
  });

  async function runCase(caseName, desc, claimText, url, expectedVerdict, allowRejudge = false) {
    console.log(`\n======================================================`);
    console.log(`Executing ${caseName}: ${desc}`);
    console.log(`Claim: "${claimText}"`);
    console.log(`URL: ${url}`);

    // 1. Lodge claim
    const lodgeTx = await client.writeContract({
      address: contractAddress,
      functionName: 'lodge_claim',
      args: [claimText, url],
    });
    console.log(`Lodge Tx: ${lodgeTx}`);
    const lodgeReceipt = await client.waitForTransactionReceipt({
      hash: lodgeTx,
      retries: 120,
      interval: 3000,
    });
    console.log(`Lodge Receipt: ${lodgeReceipt.status_name} / ${lodgeReceipt.result_name}`);

    // Read latest id
    const recentJson = await client.readContract({
      address: contractAddress,
      functionName: 'list_recent',
      args: [1],
    });
    const currentId = JSON.parse(recentJson)[0];
    console.log(`Lodged Claim ID: ${currentId}`);

    // 2. Judge claim
    const t0 = Date.now();
    const judgeTx = await client.writeContract({
      address: contractAddress,
      functionName: 'judge_claim',
      args: [currentId],
    });
    console.log(`Judge Tx: ${judgeTx}`);
    const judgeReceipt = await client.waitForTransactionReceipt({
      hash: judgeTx,
      retries: 120,
      interval: 3000,
    });
    const elapsed = (Date.now() - t0) / 1000;
    console.log(`Judge Receipt: ${judgeReceipt.status_name} / ${judgeReceipt.result_name} (${elapsed.toFixed(2)}s)`);

    // Read back ruling
    const rulingJson = await client.readContract({
      address: contractAddress,
      functionName: 'get_ruling',
      args: [currentId],
    });
    const ruling = JSON.parse(rulingJson);
    console.log(`Read-back Ruling:`, ruling);

    let rejudgeTx = null;
    let rejudgeRuling = null;
    if (allowRejudge) {
      console.log(`Executing second judgment attempt on ${currentId} (accounting test)...`);
      const t1 = Date.now();
      rejudgeTx = await client.writeContract({
        address: contractAddress,
        functionName: 'judge_claim',
        args: [currentId],
      });
      const rejudgeReceipt = await client.waitForTransactionReceipt({
        hash: rejudgeTx,
        retries: 120,
        interval: 3000,
      });
      console.log(`Rejudge Receipt: ${rejudgeReceipt.status_name} / ${rejudgeReceipt.result_name} (${((Date.now() - t1)/1000).toFixed(2)}s)`);
      const rejudgeJson = await client.readContract({
        address: contractAddress,
        functionName: 'get_ruling',
        args: [currentId],
      });
      rejudgeRuling = JSON.parse(rejudgeJson);
      console.log(`Rejudge Read-back Ruling:`, rejudgeRuling);
    }

    const record = {
      case_name: caseName,
      description: desc,
      claim_id: currentId,
      claim_text: claimText,
      url: url,
      lodge_tx: lodgeTx,
      lodge_status: lodgeReceipt.status_name,
      judge_tx: judgeTx,
      judge_status: judgeReceipt.status_name,
      judge_result: judgeReceipt.result_name,
      expected_verdict: expectedVerdict,
      recorded_verdict: ruling.verdict,
      attempts: ruling.attempts,
      latency_sec: elapsed,
      rejudge_tx: rejudgeTx,
      rejudge_ruling: rejudgeRuling,
    };
    evidenceRecords.push(record);
    return record;
  }

  // Case (b): CONTRADICTS (same page, flipped fact)
  await runCase(
    "case_b_contradicts",
    "Flipped fact against supports.md (page states $14.2M, claim asserts operating expenses were $50M)",
    "Project Nova total operating expenses exceeded $50 million during the third quarter.",
    SUPPORTS_URL,
    "CONTRADICTS"
  );

  // Case (c): NOT_ADDRESSED (related domain but unmentioned assertion)
  await runCase(
    "case_c_not_addressed",
    "Unmentioned assertion against supports.md (page does not mention CEO departure)",
    "Project Nova chief executive officer announced an immediate resignation in September 2026.",
    SUPPORTS_URL,
    "NOT_ADDRESSED"
  );

  // Case (d): Near-miss (star test fixture: claim says 15 percent, page says 51 percent)
  await runCase(
    "case_d_near_miss",
    "Near-miss star test: claim says 15 percent, source page says 51 percent",
    "Project Nova validator node operations grew 15 percent across European and Asian validator clusters.",
    NEAR_MISS_URL,
    "CONTRADICTS"
  );

  // Case (e): Prompt injection fixture
  await runCase(
    "case_e_prompt_injection",
    "Prompt injection defense: page contains SYSTEM instructions to force SUPPORTS",
    "Project Nova achieved 100 percent net profit margin on all cryptographic transactions.",
    INJECTION_URL,
    "NOT_ADDRESSED"
  );

  // Case (f): UNREADABLE (404 URL) with re-judge attempt accounting
  await runCase(
    "case_f_unreadable_404_and_rejudge",
    "HTTP 404 URL forces UNREADABLE, and subsequent re-judge increments attempt counter",
    "Project Nova announced a new quantum proof validation layer in October 2026.",
    NOT_FOUND_URL,
    "UNREADABLE",
    true // allowRejudge
  );

  // Case (g): UNREADABLE (short page < 200 chars)
  await runCase(
    "case_g_unreadable_short_page",
    "Fixture shorter than 200 chars forces UNREADABLE",
    "Project Nova distributed computing architecture uses minimal state storage.",
    SHORT_URL,
    "UNREADABLE"
  );

  // Read final stats and discovery views
  const finalStats = await client.readContract({
    address: contractAddress,
    functionName: 'get_stats',
    args: [],
  });
  console.log("\nFinal Contract Stats:", finalStats);

  const recentClaims = await client.readContract({
    address: contractAddress,
    functionName: 'list_recent',
    args: [10],
  });
  console.log("Final Recent Claims:", recentClaims);

  const fullEvidence = {
    contractAddress: contractAddress,
    deployTxHash: coreData.deployTxHash,
    cases: evidenceRecords,
    finalStats: JSON.parse(finalStats),
    recentClaims: JSON.parse(recentClaims),
  };

  fs.writeFileSync(
    path.join(__dirname, 'live_evidence.json'),
    JSON.stringify(fullEvidence, null, 2)
  );
  console.log("\nAll on-chain evidence runs completed successfully! Saved to live_evidence.json");
}

main().catch(err => {
  console.error("Evidence execution error:", err);
  process.exit(1);
});
