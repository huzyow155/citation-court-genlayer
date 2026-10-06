# Transaction Receipts & Consensus Evidence: Citation Court

This document verifies the three-part transaction receipt criteria across all primary write transactions on GenLayer Studionet.

### Receipt Success Rule (All 3 Conditions Required):
1. `status_name === "ACCEPTED"`
2. `result_name === "MAJORITY_AGREE"`
3. `consensus_data.leader_receipt[0].execution_result === "SUCCESS"`

---

## 1. Summary Table

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
| CitedBoard Post Article | `0x9c6d6e6b6021d9c1b6049cfb236dab89fab565820a7d1ce7e2383ecc928b1df8` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | YES (PASSED) |

---

## 2. Raw Receipt Extracts (JSON)

### CitationCourt Deploy
- **Hash**: `0x99c85d3d9820f1fc691559dfb0ec5e1744adf6ef77c132c54c51b6f26dcc2c04`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0x99c85d3d9820f1fc691559dfb0ec5e1744adf6ef77c132c54c51b6f26dcc2c04",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0x06cd2B6279B28A3E82D6b97A35a1bB170a9654bF",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### Case A (Supports) Judge
- **Hash**: `0xa64cd6227bd3ed898d955f01fb44bd05e234ae4219c4b3b7f2e8d0b2a85ba0ea`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0xa64cd6227bd3ed898d955f01fb44bd05e234ae4219c4b3b7f2e8d0b2a85ba0ea",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0x06cd2B6279B28A3E82D6b97A35a1bB170a9654bF",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### Case B (Contradicts) Judge
- **Hash**: `0xfd75f4f5d4a3bcd42d4bcc541b6da938962bc88d8baa6ad3db49c77495d4fe7f`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0xfd75f4f5d4a3bcd42d4bcc541b6da938962bc88d8baa6ad3db49c77495d4fe7f",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0x138eae5591141315570081C43e94471B6F650D7D",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### Case C (Not Addressed) Judge
- **Hash**: `0xa5a690dd6fd068bd08e3118fe8dc3583af8f30fd64cfe4e9567bd3b50dff7cc4`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0xa5a690dd6fd068bd08e3118fe8dc3583af8f30fd64cfe4e9567bd3b50dff7cc4",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0x138eae5591141315570081C43e94471B6F650D7D",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### Case D (Near Miss) Judge
- **Hash**: `0x7fdb59625542ea1ddc594f04e382f5ed50c38e1d71fac7cd61c6a20f6ca4b3e0`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0x7fdb59625542ea1ddc594f04e382f5ed50c38e1d71fac7cd61c6a20f6ca4b3e0",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0x138eae5591141315570081C43e94471B6F650D7D",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### Case E (Prompt Injection) Judge
- **Hash**: `0x469a88b87f8b57395755fe0a8e65e6963b818df756101174c16feb015eddb651`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0x469a88b87f8b57395755fe0a8e65e6963b818df756101174c16feb015eddb651",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0x138eae5591141315570081C43e94471B6F650D7D",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### Case F Run 1 (404 Unreadable) Judge
- **Hash**: `0x1cab8dedfa68b3ddfec5e0f4a2b1bbec1e0eb1847399eb7c97f34c3bb34641f8`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0x1cab8dedfa68b3ddfec5e0f4a2b1bbec1e0eb1847399eb7c97f34c3bb34641f8",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0x138eae5591141315570081C43e94471B6F650D7D",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### Case F Run 2 (Re-judge Unreadable)
- **Hash**: `0xc3bbd9392441e1754ad32174b405419899ca1856d53d63c4edbeaa5e2ccc1ce2`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0xc3bbd9392441e1754ad32174b405419899ca1856d53d63c4edbeaa5e2ccc1ce2",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0x138eae5591141315570081C43e94471B6F650D7D",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### Case G (Short Page Unreadable) Judge
- **Hash**: `0xc140440182750ea3f4f12ea0ce6e6b1c9bd94c98c499de77753ffed7367f8b65`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0xc140440182750ea3f4f12ea0ce6e6b1c9bd94c98c499de77753ffed7367f8b65",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0x138eae5591141315570081C43e94471B6F650D7D",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### Case H (Wiki Earth Supports) Judge
- **Hash**: `0xdb555c3638b551b6aeef67a88b2f58063881995af5ba449d2c8e4c6d4c261ecf`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0xdb555c3638b551b6aeef67a88b2f58063881995af5ba449d2c8e4c6d4c261ecf",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0xc669923fd27725ca7892b95079a2936277d337d1",
  "to_address": "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5",
  "votes_count": 5
}
```

### CitedBoard Deploy
- **Hash**: `0xda0bfe5a8cc325a79eb10db9147eec71f4f15ffd539a5a2fa9c8690f5c0a548e`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0xda0bfe5a8cc325a79eb10db9147eec71f4f15ffd539a5a2fa9c8690f5c0a548e",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0xFa735A5DE1F29811DA9b235775D078d45E1643D3",
  "to_address": "0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4",
  "votes_count": 5
}
```

### CitedBoard Post Article
- **Hash**: `0x9c6d6e6b6021d9c1b6049cfb236dab89fab565820a7d1ce7e2383ecc928b1df8`
- **Status**: `ACCEPTED`
- **Result**: `MAJORITY_AGREE`
- **Leader Execution**: `SUCCESS`

```json
{
  "hash": "0x9c6d6e6b6021d9c1b6049cfb236dab89fab565820a7d1ce7e2383ecc928b1df8",
  "status_name": "ACCEPTED",
  "result_name": "MAJORITY_AGREE",
  "leader_execution_result": "SUCCESS",
  "from_address": "0xFa735A5DE1F29811DA9b235775D078d45E1643D3",
  "to_address": "0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4",
  "votes_count": 5
}
```
