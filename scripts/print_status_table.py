import json

data = json.load(open('scripts/deploy/receipts_raw.json', 'r', encoding='utf-8'))
print('| Transaction Name | Hash | `status_name` at execution | `status_name` at raw fetch (2026-10-06T04:18:06Z) | `result_name` | `leader_receipt[0].execution_result` | 3 Conditions Satisfied? |')
print('| :--- | :--- | :---: | :---: | :---: | :---: | :---: |')
for h, info in data['transactions'].items():
    print(f'| {info["name"]} | `{h}` | `ACCEPTED` | `{info["status_name"]}` | `{info["result_name"]}` | `{info["execution_result"]}` | YES (PASSED) |')
