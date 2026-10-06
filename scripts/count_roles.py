with open('docs/ADDRESS_REGISTRY.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_hash = False
roles = {}
for l in lines:
    if '## 2. Registered Transactions' in l:
        in_hash = True
        continue
    elif '## 3.' in l:
        in_hash = False
        continue
    if in_hash and l.startswith('| `0x'):
        role = l.split('|')[2].strip()
        roles[role] = roles.get(role, 0) + 1

for r, c in sorted(roles.items()):
    print(f"{r}: {c}")
print(f"Total: {sum(roles.values())}")
