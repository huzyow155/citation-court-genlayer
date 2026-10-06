import json

# 1. Update docs/ADDRESS_REGISTRY.md
with open('docs/ADDRESS_REGISTRY.md', 'r', encoding='utf-8') as f:
    ar_text = f.read()

# Replace runner addresses
ar_text = ar_text.replace('0x138eae5591141315570081C43e94471B6F650D7D', '0x138eae55425d2192612da913b20CfAEe396F7bB6')
ar_text = ar_text.replace('0xc669923fd27725ca7892b95079a2936277d337d1', '0xc669923f824c00B3210c00627434127673D7A056')

# Replace truncated addresses with full checksum addresses
ar_text = ar_text.replace('0x138eae55...', '0x138eae55425d2192612da913b20CfAEe396F7bB6')
ar_text = ar_text.replace('0x06cd2B62...', '0x06cd2B6279B28A3E82D6b97A35a1bB170a9654bF')
ar_text = ar_text.replace('0xFa735A5D...', '0xFa735A5DE1F29811DA9b235775D078d45E1643D3')
ar_text = ar_text.replace('0xc669923f...', '0xc669923f824c00B3210c00627434127673D7A056')
ar_text = ar_text.replace('0x88e9a06a...', '0x88e9a06a57ebb9D7Bf3A7137e14D268EB6dd916D')
ar_text = ar_text.replace('0x58aDf2Fd...', '0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5')
ar_text = ar_text.replace('0x339dA017...', '0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4')
ar_text = ar_text.replace('0xC5da3E1C...', '0xC5da3E1C809df4635738F6d6065c5629EFF7190C')

with open('docs/ADDRESS_REGISTRY.md', 'w', encoding='utf-8') as f:
    f.write(ar_text)
print("Updated docs/ADDRESS_REGISTRY.md successfully!")

# 2. Update docs/RECEIPTS.md
with open('docs/RECEIPTS.md', 'r', encoding='utf-8') as f:
    rec_text = f.read()

rec_text = rec_text.replace('0x138eae5591141315570081C43e94471B6F650D7D', '0x138eae55425d2192612da913b20CfAEe396F7bB6')
rec_text = rec_text.replace('0xc669923fd27725ca7892b95079a2936277d337d1', '0xc669923f824c00B3210c00627434127673D7A056')

# Update rule description
old_rule = """### Receipt Success Rule (All 3 Conditions Required):
1. `status_name === "ACCEPTED"`
2. `result_name === "MAJORITY_AGREE"`
3. `consensus_data.leader_receipt[0].execution_result === "SUCCESS"`"""

new_rule = """### Receipt Success Rule (All 3 Conditions Required):
1. `status_name` is `"ACCEPTED"` or `"FINALIZED"`
2. `result_name === "MAJORITY_AGREE"`
3. `consensus_data.leader_receipt[0].execution_result === "SUCCESS"`

> **Note on `status_name` confirmation**: During initial execution and polling on Studionet, write transactions returned `status_name: "ACCEPTED"`. At raw RPC archive fetch (`2026-10-06T04:18:06Z`), the on-chain receipt status reads `status_name: "FINALIZED"`. Both values indicate successful validator consensus on GenLayer Studionet."""

rec_text = rec_text.replace(old_rule, new_rule)

# Update Table 1 in docs/RECEIPTS.md to include the raw fetch status column
old_table = """## 1. Summary Table

| Transaction Name | Hash | `status_name` | `result_name` | `leader_receipt[0].execution_result` | 3 Conditions Satisfied? |
| :--- | :--- | :---: | :---: | :---: | :---: |
| CitationCourt Deploy | `0x99c85d3d9820f1fc691559dfb0ec5e1744adf6ef77c132c54c51b6f26dcc2c04` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case A (Supports) Judge | `0xa64cd6227bd3ed898d955f01fb44bd05e234ae4219c4b3b7f2e8d0b2a85ba0ea` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case B (Contradicts) Judge | `0xfd75f4f5d4a3bcd42d4bcc541b6da938962bc88d8baa6ad3db49c77495d4fe7f` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case C (Not Addressed) Judge | `0xa5a690dd6fd068bd08e3118fe8dc3583af8f30fd64cfe4e9567bd3b50dff7cc4` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case D (Near Miss) Judge | `0x7fdb59625542ea1ddc594f04e382f5ed50c38e1d71fac7cd61c6a20f6ca4b3e0` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case E (Prompt Injection) Judge | `0x469a88b87f8b57395755fe0a8e65e6963b818df756101174c16feb015eddb651` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case F Run 1 (404 Unreadable) Judge | `0x1cab8dedfa68b3ddfec5e0f4a2b1bbec1e0eb1847399eb7c97f34c3bb34641f8` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case F Run 2 (Re-judge Unreadable) | `0xc3bbd9392441e1754ad32174b405419899ca1856d53d63c4edbeaa5e2ccc1ce2` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case G (Short Page Unreadable) Judge | `0xc140440182750ea3f4f12ea0ce6e6b1c9bd94c98c499de77753ffed7367f8b65` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case H (Wiki Earth Supports) Judge | `0xdb555c3638b551b6aeef67a88b2f58063881995af5ba449d2c8e4c6d4c261ecf` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| CitedBoard Deploy | `0xda0bfe5a8cc325a79eb10db9147eec71f4f15ffd539a5a2fa9c8690f5c0a548e` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| CitedBoard Post Article | `0x9c6d6e6b6021d9c1b6049cfb236dab89fab565820a7d1ce7e2383ecc928b1df8` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |"""

new_table = """## 1. Summary Table

| Transaction Name | Hash | `status_name` at execution | `status_name` at raw fetch (2026-10-06T04:18:06Z) | `result_name` | `leader_receipt[0].execution_result` | 3 Conditions Satisfied? |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| CitationCourt Deploy | `0x99c85d3d9820f1fc691559dfb0ec5e1744adf6ef77c132c54c51b6f26dcc2c04` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case A (Supports) Judge | `0xa64cd6227bd3ed898d955f01fb44bd05e234ae4219c4b3b7f2e8d0b2a85ba0ea` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case B (Contradicts) Judge | `0xfd75f4f5d4a3bcd42d4bcc541b6da938962bc88d8baa6ad3db49c77495d4fe7f` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case C (Not Addressed) Judge | `0xa5a690dd6fd068bd08e3118fe8dc3583af8f30fd64cfe4e9567bd3b50dff7cc4` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case D (Near Miss) Judge | `0x7fdb59625542ea1ddc594f04e382f5ed50c38e1d71fac7cd61c6a20f6ca4b3e0` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case E (Prompt Injection) Judge | `0x469a88b87f8b57395755fe0a8e65e6963b818df756101174c16feb015eddb651` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case F Run 1 (404 Unreadable) Judge | `0x1cab8dedfa68b3ddfec5e0f4a2b1bbec1e0eb1847399eb7c97f34c3bb34641f8` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case F Run 2 (Re-judge Unreadable) | `0xc3bbd9392441e1754ad32174b405419899ca1856d53d63c4edbeaa5e2ccc1ce2` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case G (Short Page Unreadable) Judge | `0xc140440182750ea3f4f12ea0ce6e6b1c9bd94c98c499de77753ffed7367f8b65` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| Case H (Wiki Earth Supports) Judge | `0xdb555c3638b551b6aeef67a88b2f58063881995af5ba449d2c8e4c6d4c261ecf` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| CitedBoard Deploy | `0xda0bfe5a8cc325a79eb10db9147eec71f4f15ffd539a5a2fa9c8690f5c0a548e` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |
| CitedBoard Post Article | `0x9c6d6e6b6021d9c1b6049cfb236dab89fab565820a7d1ce7e2383ecc928b1df8` | `ACCEPTED` | `FINALIZED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |"""

rec_text = rec_text.replace(old_table, new_table)

with open('docs/RECEIPTS.md', 'w', encoding='utf-8') as f:
    f.write(rec_text)
print("Updated docs/RECEIPTS.md successfully!")

# 3. Update docs/INTEGRATION.md
with open('docs/INTEGRATION.md', 'r', encoding='utf-8') as f:
    integ_text = f.read()

old_integ_rule = """1. `receipt.status_name === "ACCEPTED"`
2. `receipt.result_name === "MAJORITY_AGREE"`
3. `receipt.consensus_data.leader_receipt[0].execution_result === "SUCCESS"`"""

new_integ_rule = """1. `receipt.status_name === "ACCEPTED"` or `receipt.status_name === "FINALIZED"`
2. `receipt.result_name === "MAJORITY_AGREE"`
3. `receipt.consensus_data.leader_receipt[0].execution_result === "SUCCESS"`
4. Read state back via view calls to confirm persisted state."""

integ_text = integ_text.replace(old_integ_rule, new_integ_rule)

old_integ_note = """- **Receipt Success Requirement**: A transaction is successful only when `receipt.status_name === "ACCEPTED"`, `receipt.result_name === "MAJORITY_AGREE"`, and leader receipt has `execution_result === "SUCCESS"`."""

new_integ_note = """- **Receipt Success Requirement**: A transaction is accepted by validators only when `receipt.status_name === "ACCEPTED"` or `receipt.status_name === "FINALIZED"`, `receipt.result_name === "MAJORITY_AGREE"`, and leader receipt has `execution_result === "SUCCESS"`; callers should then read back state via view methods (`get_ruling`, `get_stats`)."""

integ_text = integ_text.replace(old_integ_note, new_integ_note)

with open('docs/INTEGRATION.md', 'w', encoding='utf-8') as f:
    f.write(integ_text)
print("Updated docs/INTEGRATION.md successfully!")

# 4. Update scripts/build_registry.js
with open('scripts/build_registry.js', 'r', encoding='utf-8') as f:
    br_text = f.read()

br_text = br_text.replace('0x138eae5591141315570081C43e94471B6F650D7D', '0x138eae55425d2192612da913b20CfAEe396F7bB6')
br_text = br_text.replace('0xc669923fd27725ca7892b95079a2936277d337d1', '0xc669923f824c00B3210c00627434127673D7A056')

with open('scripts/build_registry.js', 'w', encoding='utf-8') as f:
    f.write(br_text)
print("Updated scripts/build_registry.js successfully!")
