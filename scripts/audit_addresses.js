const fs = require('fs');
const path = require('path');
const { getAddress } = require('viem');

// 1. Load receipt files
const receiptsRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy', 'receipts_raw.json'), 'utf8'));
const coreOutput = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy', 'core_output.json'), 'utf8'));
const consumerOutput = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy', 'consumer_output.json'), 'utf8'));
const probeOutput = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy', 'probe_output.json'), 'utf8'));
const deployments = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy', 'deployments.json'), 'utf8'));
const liveEvidence = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy', 'live_evidence.json'), 'utf8'));

// Helper to collect all address paths from an object
function collectAddresses(obj, targetFile, currentPath = '', addressMap = new Map()) {
  if (!obj) return addressMap;
  if (typeof obj === 'string') {
    if (/^0x[a-fA-F0-9]{40}$/.test(obj)) {
      const lower = obj.toLowerCase();
      if (!addressMap.has(lower)) addressMap.set(lower, []);
      addressMap.get(lower).push({ file: targetFile, path: currentPath, raw: obj });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      collectAddresses(item, targetFile, `${currentPath}[${idx}]`, addressMap);
    });
  } else if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      // Check if key itself is an address (e.g., consensus_data.votes)
      if (/^0x[a-fA-F0-9]{40}$/.test(k)) {
        const lower = k.toLowerCase();
        if (!addressMap.has(lower)) addressMap.set(lower, []);
        addressMap.get(lower).push({ file: targetFile, path: currentPath ? `${currentPath}.${k}` : k, raw: k });
      }
      collectAddresses(v, targetFile, currentPath ? `${currentPath}.${k}` : k, addressMap);
    }
  }
  return addressMap;
}

const truthMap = new Map();
collectAddresses(receiptsRaw, 'receipts_raw.json', '', truthMap);
collectAddresses(coreOutput, 'core_output.json', '', truthMap);
collectAddresses(consumerOutput, 'consumer_output.json', '', truthMap);
collectAddresses(probeOutput, 'probe_output.json', '', truthMap);
collectAddresses(deployments, 'deployments.json', '', truthMap);
collectAddresses(liveEvidence, 'live_evidence.json', '', truthMap);

// Scan all doc files and markdown files for any 0x 40-hex addresses
const docFiles = [
  'README.md',
  'docs/ADDRESS_REGISTRY.md',
  'docs/DESIGN.md',
  'docs/INTEGRATION.md',
  'docs/PRIOR_ART.md',
  'docs/RECEIPTS.md',
  'docs/RUNTIME_NOTES.md',
  'docs/THREAT_MODEL.md',
  'docs/VERIFICATION.md',
];

const foundInDocs = new Map();

for (const relPath of docFiles) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');
  const matches = content.match(/\b0x[a-fA-F0-9]{40}\b/g) || [];
  for (const m of matches) {
    const lower = m.toLowerCase();
    if (!foundInDocs.has(lower)) foundInDocs.set(lower, new Set());
    foundInDocs.get(lower).add({ file: relPath, raw: m });
  }
}

console.log('=== ADDRESS AUDIT TABLE ===');
console.log('| địa chỉ (in docs) | tìm thấy ở đâu (file:path) | khớp checksum? | địa chỉ checksum chuẩn |');
console.log('| :--- | :--- | :---: | :--- |');

const allDocAddresses = Array.from(foundInDocs.keys()).sort();

for (const lower of allDocAddresses) {
  const docInstances = Array.from(foundInDocs.get(lower));
  const sampleDocRaw = docInstances[0].raw;
  const checksumExpected = getAddress(lower);
  const checksumMatch = (sampleDocRaw === checksumExpected) ? 'YES' : 'NO';

  const truthSources = truthMap.get(lower) || [];
  let sourceSummary = 'NOT FOUND IN RECEIPTS';
  if (truthSources.length > 0) {
    // Pick the most relevant path
    const p = truthSources[0];
    sourceSummary = `${p.file}:${p.path}`;
    if (truthSources.length > 1) {
      sourceSummary += ` (+${truthSources.length - 1} more)`;
    }
  }

  console.log(`| \`${sampleDocRaw}\` | ${sourceSummary} | ${checksumMatch} | \`${checksumExpected}\` |`);
}
