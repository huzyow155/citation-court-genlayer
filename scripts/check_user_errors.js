const fs = require('fs');

const cc = fs.readFileSync('contracts/CitationCourt.py', 'utf8');
const h = fs.readFileSync('tests/helpers_for_test.py', 'utf8');
const sim = fs.readFileSync('tests/test_layer2_mocked.py', 'utf8');

const reCc = /raise gl\.vm\.UserError\("([^"]+)"\)/g;
const reSim = /raise UserError\("([^"]+)"\)/g;

function getMatches(str, re) {
  const matches = new Set();
  let m;
  while ((m = re.exec(str)) !== null) {
    matches.add(m[1]);
  }
  return matches;
}

const ccErrors = getMatches(cc, reCc);
const simErrors = new Set([...getMatches(h, reSim), ...getMatches(sim, reSim)]);

console.log('CitationCourt UserErrors count:', ccErrors.size);
console.log('Simulator UserErrors count:', simErrors.size);

const diff1 = [...ccErrors].filter(x => !simErrors.has(x));
const diff2 = [...simErrors].filter(x => !ccErrors.has(x));
console.log('In contract but missing in simulator:', diff1);
console.log('In simulator but missing in contract:', diff2);

console.log('\nExact UserError strings verified:');
[...ccErrors].sort().forEach(e => console.log(' - ' + e));
