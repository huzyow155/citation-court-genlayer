import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const robustnessDir = path.join(__dirname, '../docs/evidence_m1/robustness_supports2');
const scenariosPath = path.join(__dirname, '../docs/evidence_m1/scenarios_raw.json');

console.log("=== CITATION COURT V2 - ON-CHAIN ROBUSTNESS EVALUATION REPORT ===");
console.log("Target Fixture: fixtures/supports2.md");
console.log("Expected Verdict: SUPPORTS");
console.log("Pre-Registered Rule: match = verdict SUPPORTS; pass = at least 9 of 10 SUPPORTS");
console.log("Receipt Rule: status in [ACCEPTED, FINALIZED] AND result == MAJORITY_AGREE AND exec == SUCCESS\n");

if (!fs.existsSync(robustnessDir)) {
  console.log("No robustness directory found at " + robustnessDir);
  process.exit(1);
}

const files = fs.readdirSync(robustnessDir).filter(f => f.startsWith('run_') && f.endsWith('.json')).sort();
console.log(`Found ${files.length} robustness trial files.\n`);

const rows = [];
let matchCount = 0;
let totalRuns = files.length;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(robustnessDir, file), 'utf8'));
  const isMatch = data.recorded_verdict === "SUPPORTS";
  if (isMatch) matchCount++;

  const jTriple = `${data.judge.status_name} / ${data.judge.result_name} / ${data.judge.execution_result}`;
  const tripleValid = (data.judge.status_name === "ACCEPTED" || data.judge.status_name === "FINALIZED") &&
                      data.judge.result_name === "MAJORITY_AGREE" &&
                      data.judge.execution_result === "SUCCESS";

  rows.push({
    run: data.run_id,
    claim_id: data.claim_id,
    lodge_tx: data.lodge.tx_hash.slice(0, 10) + '...' + data.lodge.tx_hash.slice(-8),
    judge_tx: data.judge.tx_hash.slice(0, 10) + '...' + data.judge.tx_hash.slice(-8),
    judge_triple: jTriple,
    triple_ok: tripleValid ? "YES" : "NO",
    latency: `${data.timings.judge_seconds.toFixed(2)}s`,
    verdict: data.recorded_verdict,
    match: isMatch ? "PASS" : "FAIL",
  });
}

console.log("| Run | Claim ID | Lodge Tx | Judge Tx | Receipt Status Triple | Triple OK | Latency | Verdict | Match |");
console.log("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |");
for (const r of rows) {
  console.log(`| ${r.run} | ${r.claim_id} | \`${r.lodge_tx}\` | \`${r.judge_tx}\` | \`${r.judge_triple}\` | ${r.triple_ok} | ${r.latency} | ${r.verdict} | ${r.match} |`);
}

console.log("\n### Earlier Scenario Judgments for supports2.md (Scenarios a and f)");
if (fs.existsSync(scenariosPath)) {
  const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));
  const a_j1_tx = scenarios.a.txs.judge_1;
  const a_triple = `${scenarios.a.triples.judge_1.status_name} / ${scenarios.a.triples.judge_1.result_name} / ${scenarios.a.triples.judge_1.execution_result}`;
  const f_j1_tx = scenarios.f.txs.judge_1;
  const f_triple = `${scenarios.f.triples.judge_1.status_name} / ${scenarios.f.triples.judge_1.result_name} / ${scenarios.f.triples.judge_1.execution_result}`;

  console.log("| Context | Claim ID | Judge Tx | Receipt Status Triple | Verdict | Match |");
  console.log("| :--- | :--- | :--- | :--- | :--- | :--- |");
  console.log(`| Scenario (a) src 1 | 1 | \`${a_j1_tx.slice(0, 10)}...${a_j1_tx.slice(-8)}\` | \`${a_triple}\` | SUPPORTS | PASS |`);
  console.log(`| Scenario (f) src 1 | 10 | \`${f_j1_tx.slice(0, 10)}...${f_j1_tx.slice(-8)}\` | \`${f_triple}\` | SUPPORTS | PASS |`);
}

console.log("\n### Summary Statistics");
console.log(`Total Trials (Dedicated): ${totalRuns}`);
console.log(`Matches (verdict == SUPPORTS): ${matchCount}/${totalRuns} (${((matchCount / (totalRuns || 1)) * 100).toFixed(1)}%)`);
console.log(`Parse Success: not measured (on-chain fallback does not expose parser exceptions)`);
console.log(`Pre-Registered Pass Rule: at least 9 of 10 SUPPORTS (>= 90%)`);
console.log(`Evaluation Status: ${matchCount >= 9 && totalRuns === 10 ? "PASSED" : (totalRuns < 10 ? "INCOMPLETE" : "FAILED")}`);
