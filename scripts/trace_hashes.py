import json

files = {
    'core_output.json': json.load(open('scripts/deploy/core_output.json')),
    'consumer_output.json': json.load(open('scripts/deploy/consumer_output.json')),
    'probe_output.json': json.load(open('scripts/deploy/probe_output.json')),
    'live_evidence.json': json.load(open('scripts/deploy/live_evidence.json')),
}

def find_paths(obj, target, current_path=''):
    paths = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_path = current_path + '.' + k if current_path else k
            if k == target or (isinstance(v, str) and target.lower() == v.lower()):
                paths.append(new_path)
            paths.extend(find_paths(v, target, new_path))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            new_path = current_path + '[' + str(i) + ']'
            if isinstance(item, str) and target.lower() == item.lower():
                paths.append(new_path)
            paths.extend(find_paths(item, target, new_path))
    return paths

with open('docs/ADDRESS_REGISTRY.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for l in lines:
    if l.startswith('| `0x'):
        val = l.split('`')[1]
        if len(val) == 66:
            found = {}
            for fname, data in files.items():
                p = find_paths(data, val)
                if p:
                    found[fname] = p
            print(val, found)
