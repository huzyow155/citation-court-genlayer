import json

core = json.load(open('scripts/deploy/core_output.json'))
consumer = json.load(open('scripts/deploy/consumer_output.json'))
probe = json.load(open('scripts/deploy/probe_output.json'))
live = json.load(open('scripts/deploy/live_evidence.json'))

# Top-level transactions mapping
tx_map = {
    # Deploy
    "0x99c85d3d9820f1fc691559dfb0ec5e1744adf6ef77c132c54c51b6f26dcc2c04": {
        "role": "CitationCourt Deploy Tx",
        "evidence": "from: 0x06cd2B62..., to: 0x58aDf2Fd..., fn: deploy (core_output.json:deployTxHash)",
    },
    "0x849659f8a73ad2c5626f7b6b55217fbb8bd33bdece97e936924e9a00bed1e1b6": {
        "role": "RuntimeProbe Deploy Tx",
        "evidence": "from: 0x88e9a06a..., to: 0xC5da3E1C..., fn: deploy (probe_output.json:deployTxHash)",
    },
    "0xda0bfe5a8cc325a79eb10db9147eec71f4f15ffd539a5a2fa9c8690f5c0a548e": {
        "role": "CitedBoard Deploy Tx",
        "evidence": "from: 0xFa735A5D..., to: 0x339dA017..., fn: deploy (consumer_output.json:deployTxHash)",
    },
    # Consumer post
    "0x9c6d6e6b6021d9c1b6049cfb236dab89fab565820a7d1ce7e2383ecc928b1df8": {
        "role": "CitedBoard Post Article Tx",
        "evidence": "from: 0xFa735A5D..., to: 0x339dA017..., fn: post (consumer_output.json:postTx1)",
    },
    # Probe consensus
    "0x4bdc54a36130d1ea482b127b55f13dff4f8e3bbbc2282c80014bba966a26a8de": {
        "role": "RuntimeProbe probe_consensus Tx",
        "evidence": "from: 0x88e9a06a..., to: 0xC5da3E1C..., fn: probe_consensus (probe_output.json:consensusTxHash)",
    },
    # Case A
    "0x041b1d4af8da6622451e49b4d045a43a6d87e4b2a63e1d3f544779a0b9fc5cc9": {
        "role": "Case A (Supports) lodge_claim Tx",
        "evidence": "from: 0x06cd2B62..., to: 0x58aDf2Fd..., fn: lodge_claim (core_output.json:lodgeTx1)",
    },
    "0xa64cd6227bd3ed898d955f01fb44bd05e234ae4219c4b3b7f2e8d0b2a85ba0ea": {
        "role": "Case A (Supports) judge_claim Tx",
        "evidence": "from: 0x06cd2B62..., to: 0x58aDf2Fd..., fn: judge_claim (core_output.json:judgeTx1)",
    },
    # Case B
    "0x4d94d98607705f3567a51f68977e37ee7fe32f93a1bdacb58836a3f35c842236": {
        "role": "Case B (Contradicts) lodge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: lodge_claim (live_evidence.json:cases[1].lodge_tx)",
    },
    "0xfd75f4f5d4a3bcd42d4bcc541b6da938962bc88d8baa6ad3db49c77495d4fe7f": {
        "role": "Case B (Contradicts) judge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: judge_claim (live_evidence.json:cases[1].judge_tx)",
    },
    # Case C
    "0x587c85f3f162d39970b49c02f44e36555321ab2150dd6efdd2b5d8778018b763": {
        "role": "Case C (Not Addressed) lodge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: lodge_claim (live_evidence.json:cases[2].lodge_tx)",
    },
    "0xa5a690dd6fd068bd08e3118fe8dc3583af8f30fd64cfe4e9567bd3b50dff7cc4": {
        "role": "Case C (Not Addressed) judge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: judge_claim (live_evidence.json:cases[2].judge_tx)",
    },
    # Case D
    "0xbe1a397bb81e0f5bebf6570cf0189bd243a8a1b7f0b428c270cb3b122aac4089": {
        "role": "Case D (Near Miss) lodge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: lodge_claim (live_evidence.json:cases[3].lodge_tx)",
    },
    "0x7fdb59625542ea1ddc594f04e382f5ed50c38e1d71fac7cd61c6a20f6ca4b3e0": {
        "role": "Case D (Near Miss) judge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: judge_claim (live_evidence.json:cases[3].judge_tx)",
    },
    # Case E
    "0x7d0361441f7d38f07d00399b108ced75b0025ca828addd1f04342395fdd14e9a": {
        "role": "Case E (Prompt Injection) lodge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: lodge_claim (live_evidence.json:cases[4].lodge_tx)",
    },
    "0x469a88b87f8b57395755fe0a8e65e6963b818df756101174c16feb015eddb651": {
        "role": "Case E (Prompt Injection) judge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: judge_claim (live_evidence.json:cases[4].judge_tx)",
    },
    # Case F
    "0x734a684a9abc9947ee32a75edb85665e9c0fa2108cc8d25baca99d45188a1c62": {
        "role": "Case F (404 Unreadable) lodge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: lodge_claim (live_evidence.json:cases[5].lodge_tx)",
    },
    "0x1cab8dedfa68b3ddfec5e0f4a2b1bbec1e0eb1847399eb7c97f34c3bb34641f8": {
        "role": "Case F (404 Unreadable) judge_claim Run 1 Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: judge_claim (live_evidence.json:cases[5].judge_tx)",
    },
    "0xc3bbd9392441e1754ad32174b405419899ca1856d53d63c4edbeaa5e2ccc1ce2": {
        "role": "Case F (404 Unreadable) judge_claim Run 2 (Re-judge) Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: judge_claim (live_evidence.json:cases[5].rejudge_tx)",
    },
    # Case G
    "0xc6055bbb59c8d1883c0fd990414f98bb5ab61eb12be9b2ba2bff5307374c83d2": {
        "role": "Case G (Short Page Unreadable) lodge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: lodge_claim (live_evidence.json:cases[6].lodge_tx)",
    },
    "0xc140440182750ea3f4f12ea0ce6e6b1c9bd94c98c499de77753ffed7367f8b65": {
        "role": "Case G (Short Page Unreadable) judge_claim Tx",
        "evidence": "from: 0x138eae55..., to: 0x58aDf2Fd..., fn: judge_claim (live_evidence.json:cases[6].judge_tx)",
    },
    # Case H
    "0x5079397ca576761237edaac4b155b507c81802fa84b9e8da09f3b4bc094f5a9b": {
        "role": "Case H (Wiki Earth Supports) lodge_claim Tx",
        "evidence": "from: 0xc669923f..., to: 0x58aDf2Fd..., fn: lodge_claim (live_evidence.json:cases[7].lodge_tx)",
    },
    "0xdb555c3638b551b6aeef67a88b2f58063881995af5ba449d2c8e4c6d4c261ecf": {
        "role": "Case H (Wiki Earth Supports) judge_claim Tx",
        "evidence": "from: 0xc669923f..., to: 0x58aDf2Fd..., fn: judge_claim (live_evidence.json:cases[7].judge_tx)",
    },
}

from trace_hashes import files, find_paths

with open('docs/ADDRESS_REGISTRY.md', 'r', encoding='utf-8') as f:
    orig_lines = f.readlines()

new_lines = []
in_addr = False
in_hash = False

roles_count = {}

for l in orig_lines:
    if '## 1. Registered Addresses' in l:
        in_addr = True
        in_hash = False
        new_lines.append(l)
        continue
    elif '## 2. Registered Transactions' in l:
        in_addr = False
        in_hash = True
        new_lines.append(l)
        continue
    elif '## 3.' in l:
        in_addr = False
        in_hash = False
        new_lines.append(l)
        continue

    if in_addr and l.startswith('| `0x'):
        # replace EOA / Unregistered with "not a contract (getContractCode returned not found)"
        line_mod = l.replace("EOA / Unregistered", "not a contract (getContractCode returned not found)")
        new_lines.append(line_mod)
        continue

    if in_hash and l.startswith('| `0x'):
        h = l.split('`')[1]
        appeared_in = l.split('|')[-2].strip()
        if h in tx_map:
            role = tx_map[h]["role"]
            ev = tx_map[h]["evidence"]
        else:
            # Validator vote hash
            locs = []
            for fname, data in files.items():
                p = find_paths(data, h)
                for item in p:
                    locs.append(f"{fname}:{item}")
            loc_str = ", ".join(locs)
            role = f"Validator Vote Hash in raw receipt trace"
            ev = f"receipt field: {loc_str}"

        # count roles
        cat = role.split('(')[0].strip()
        roles_count[role] = roles_count.get(role, 0) + 1

        new_row = f"| `{h}` | {role} | {ev} | {appeared_in} |\n"
        new_lines.append(new_row)
        continue

    new_lines.append(l)

with open('docs/ADDRESS_REGISTRY.md', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Updated docs/ADDRESS_REGISTRY.md successfully!")
print("Roles count summary:")
for r, c in sorted(roles_count.items()):
    print(f"  {r}: {c}")
