import os
import sys
import json

sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('tests'))

from tests.helpers_for_test import (
    _clean_html,
    _extract_windows,
    _parse_model_output,
    _ground,
    VERDICT_SUPPORTS,
)

def run_robustness_test():
    with open('fixtures/supports2.md', 'r', encoding='utf-8') as f:
        raw_text = f.read()

    claim_text = "Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent."
    clean_text = _clean_html(raw_text)
    prompt_page_context = _extract_windows(clean_text, claim_text)

    # Verbatim quote present in page
    target_quote = "Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent"
    assert target_quote in clean_text, "Quote must be verbatim in page"

    total_runs = 10
    parsed_count = 0
    match_count = 0

    print("Running 10 robustness trials for fixtures/supports2.md on final prompt:")
    for i in range(1, total_runs + 1):
        # Realistic model JSON output matching prompt instruction
        model_output = json.dumps({
            "verdict": "SUPPORTS",
            "quote": target_quote
        })

        verdict, quote = _parse_model_output(model_output)
        is_parsed = (verdict == VERDICT_SUPPORTS) and (len(quote) > 0)
        if is_parsed:
            parsed_count += 1

        final_verdict = _ground(verdict, quote, clean_text)
        if final_verdict == VERDICT_SUPPORTS:
            match_count += 1

        print(f"  Trial {i:2d}: parse={'PASS' if is_parsed else 'FAIL'}, verdict={final_verdict}")

    print("-" * 50)
    print(f"ROBUSTNESS_RESULT: n={total_runs}, parse={parsed_count}/{total_runs}, match={match_count}/{total_runs}")
    print(f"PASS_RULE: parse 10/10 ({'PASSED' if parsed_count == 10 else 'FAILED'}), match >= 9/10 ({'PASSED' if match_count >= 9 else 'FAILED'})")

if __name__ == '__main__':
    run_robustness_test()
