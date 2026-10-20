import os
import sys
import re
import unittest

sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('tests'))

def count_lines(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return sum(1 for _ in f)

def count_public_methods(filepath):
    # Public methods on class CitationCourt: def <name>(self... without leading _
    pattern = re.compile(r'^\s{4}def\s+([a-zA-Z0-9_]+)\s*\(self')
    count = 0
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            m = pattern.match(line)
            if m and not m.group(1).startswith('_'):
                count += 1
    return count

def count_tests_in_module(module_name):
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromName(module_name)
    return suite.countTestCases()

def main():
    contract_file = 'contracts/CitationCourt.py'
    line_count = count_lines(contract_file)
    pub_methods = count_public_methods(contract_file)

    l1_tests = count_tests_in_module('test_layer1_pure')
    l2_tests = count_tests_in_module('test_layer2_mocked')
    l3_tests = count_tests_in_module('test_layer3_consensus')
    total_tests = l1_tests + l2_tests + l3_tests

    v1_address = "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5"
    v1_explorer = f"https://explorer-studio.genlayer.com/address/{v1_address}"

    out_path = 'docs/evidence_m1/before_state.txt'
    lines = [
        f"CONTRACT_LINE_COUNT: {line_count}",
        f"PUBLIC_METHODS_COUNT: {pub_methods}",
        f"TESTS_LAYER1_PURE: {l1_tests}",
        f"TESTS_LAYER2_MOCKED: {l2_tests}",
        f"TESTS_LAYER3_CONSENSUS: {l3_tests}",
        f"TESTS_TOTAL: {total_tests}",
        f"V1_CONTRACT_ADDRESS: {v1_address}",
        f"V1_EXPLORER_LINK: {v1_explorer}",
    ]

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')

    print(f"Generated {out_path}:")
    for line in lines:
        print(line)

if __name__ == '__main__':
    main()
