with open('docs/ADDRESS_REGISTRY.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

addrs = []
hashes = []
in_addr = False
in_hash = False

for l in lines:
    if '## 1. Registered Addresses' in l:
        in_addr = True
        in_hash = False
        continue
    elif '## 2. Registered Transactions' in l:
        in_addr = False
        in_hash = True
        continue
    elif '## 3.' in l:
        in_addr = False
        in_hash = False
        continue
    
    if l.startswith('| `0x'):
        val = l.split('`')[1]
        if len(val) == 42:
            addrs.append(val)
        elif len(val) == 66:
            hashes.append(val)

print(f"Address count: {len(addrs)}, Unique: {len(set(addrs))}")
print(f"Hash count: {len(hashes)}, Unique: {len(set(hashes))}")
