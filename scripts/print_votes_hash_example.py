import json

data = json.load(open('scripts/deploy/receipts_raw.json', 'r', encoding='utf-8'))
tx_hash = "0x99c85d3d9820f1fc691559dfb0ec5e1744adf6ef77c132c54c51b6f26dcc2c04"
receipt = data['transactions'][tx_hash]['receipt']
vvh = receipt['last_round']['validator_votes_hash']

print(f"Transaction Name: {data['transactions'][tx_hash]['name']}")
print(f"Transaction Hash: {tx_hash}")
print(f"Full JSON Path: scripts/deploy/receipts_raw.json -> transactions[\"{tx_hash}\"].receipt.last_round.validator_votes_hash[0]")
print(f"Value: {vvh[0]}")
