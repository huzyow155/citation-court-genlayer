import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read fixture hashes reference
const hashesPath = path.join(__dirname, '../docs/evidence_m1/fixture_hashes.txt');
const hashesRaw = fs.readFileSync(hashesPath, 'utf8');

const expectedHashes = {};
for (const line of hashesRaw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [filename, gitBlob, sha256, size, commitRef] = trimmed.split('|').map(s => s.trim());
  expectedHashes[filename] = { gitBlob, sha256, size: parseInt(size, 10), commitRef };
}

// Scenarios raw to extract actual URLs used on chain
const scenariosPath = path.join(__dirname, '../docs/evidence_m1/scenarios_raw.json');
const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));

const testUrls = [
  { name: 'supports.md', url: 'https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md' },
  { name: 'supports2.md', url: 'https://cdn.jsdelivr.net/gh/huzyow155/citation-court-genlayer@63efe26/fixtures/supports2.md' },
  { name: 'contradicts.md', url: 'https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/contradicts.md' },
  { name: 'injection.md', url: 'https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/injection.md' },
  { name: 'short.md', url: 'https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/short.md' },
  { name: 'near_miss.md', url: 'https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/near_miss.md' },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const hash = crypto.createHash('sha256').update(buf).digest('hex');
        resolve({
          statusCode: res.statusCode,
          bytes: buf.length,
          sha256: hash,
        });
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log("=== CITATION COURT V2 - FIXTURE INTEGRITY & PINNING CHECK ===");
  console.log("Comparing remote URLs against committed SHA-256 hashes in fixture_hashes.txt...\n");

  console.log("| Fixture | Ref Type | HTTP | Remote SHA-256 (first 16) | Committed SHA-256 (first 16) | Hash Match | Bytes |");
  console.log("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |");

  let allPassed = true;
  let mutableCount = 0;

  for (const item of testUrls) {
    const expected = expectedHashes[item.name];
    if (!expected) {
      console.error(`Missing expected hash entry for ${item.name}`);
      allPassed = false;
      continue;
    }

    const isMutable = item.url.includes('/main/') || item.url.includes('@main');
    if (isMutable) mutableCount++;

    const refType = isMutable ? "MUTABLE (@main)" : "PINNED (commit sha)";

    const res = await fetchUrl(item.url);
    const hashMatch = res.sha256 === expected.sha256;
    if (!hashMatch || res.statusCode !== 200) {
      allPassed = false;
    }

    const shortRemote = res.sha256.slice(0, 16);
    const shortExpected = expected.sha256.slice(0, 16);

    console.log(`| \`${item.name}\` | ${refType} | ${res.statusCode} | \`${shortRemote}...\` | \`${shortExpected}...\` | ${hashMatch ? "YES" : "NO"} | ${res.bytes} |`);
  }

  console.log("\n### Fixture Pinning Assessment");
  console.log(`- Total Fixtures Checked: ${testUrls.length}`);
  console.log(`- Byte-for-byte SHA-256 Matches: ${allPassed ? "100% (6/6)" : "FAILED"}`);
  console.log(`- Immutable Pinning Status: 1 pinned to commit hash (@63efe26), ${mutableCount} pointing to branch ref (/main/)`);
  console.log(`- Threat Notice: URLs targeting '/main/' are subject to branch drift if main branch is altered. Production deployments should pin immutable commit hashes or IPFS content identifiers.`);

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fixture check error:", err);
  process.exit(1);
});
