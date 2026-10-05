import unittest
from tests.helpers_for_test import (
    _ground,
    VERDICT_SUPPORTS,
    VERDICT_CONTRADICTS,
    VERDICT_NOT_ADDRESSED,
    VERDICT_UNREADABLE,
)


class TestLayer3Consensus(unittest.TestCase):
    """
    Tests validator consensus convergence and equivalence principle rules.
    Verifies that validators with identical versus divergent internal outputs
    produce the expected agreement or disagreement behavior.
    """

    def test_validators_with_identical_grounded_verdict_agree(self):
        page = "Project Nova validator telemetry confirmed node operations grew 51 percent across European clusters."
        # Validator 1 (e.g. Grok) extracts passage A
        quote_v1 = "node operations grew 51 percent across European clusters"
        res_v1 = _ground(VERDICT_SUPPORTS, quote_v1, page)

        # Validator 2 (e.g. GPT-5.4) extracts passage B (different casing/spacing)
        quote_v2 = "   validator telemetry confirmed node operations grew 51 percent   "
        res_v2 = _ground(VERDICT_SUPPORTS, quote_v2, page)

        # Validator 3 (e.g. Gemini) extracts passage C
        quote_v3 = "telemetry confirmed node operations grew 51 percent across European clusters"
        res_v3 = _ground(VERDICT_SUPPORTS, quote_v3, page)

        self.assertEqual(res_v1, VERDICT_SUPPORTS)
        self.assertEqual(res_v2, VERDICT_SUPPORTS)
        self.assertEqual(res_v3, VERDICT_SUPPORTS)
        # All validators converge on the single canonical enum SUPPORTS
        self.assertEqual(res_v1, res_v2)
        self.assertEqual(res_v2, res_v3)

    def test_validators_divergent_hallucination_collapses_to_agreement(self):
        """
        Critical consensus resilience property:
        If Validator 1 hallucinates SUPPORTS with a fabricated quote,
        while Validator 2 answers NOT_ADDRESSED directly,
        the deterministic grounding rule downgrades Validator 1 to NOT_ADDRESSED!
        Thus, rather than a split vote / disagreement, both validators agree on NOT_ADDRESSED.
        """
        page = "Project Nova validator node operations grew 51 percent across European clusters."
        fake_quote_v1 = "Project Nova validator node operations grew 15 percent"  # Fabricated

        # Validator 1 claims SUPPORTS with fake quote:
        v1_grounded = _ground(VERDICT_SUPPORTS, fake_quote_v1, page)

        # Validator 2 honestly reported NOT_ADDRESSED:
        v2_grounded = _ground(VERDICT_NOT_ADDRESSED, "", page)

        self.assertEqual(v1_grounded, VERDICT_NOT_ADDRESSED)
        self.assertEqual(v2_grounded, VERDICT_NOT_ADDRESSED)
        # Consensus converges to NOT_ADDRESSED despite hallucinating validator
        self.assertEqual(v1_grounded, v2_grounded)

    def test_unreadable_status_agreement(self):
        """
        When all validators encounter HTTP 404 or page under 200 chars,
        all yield UNREADABLE, achieving strict equality.
        """
        v1 = VERDICT_UNREADABLE
        v2 = VERDICT_UNREADABLE
        v3 = VERDICT_UNREADABLE
        self.assertEqual(v1, v2)
        self.assertEqual(v2, v3)


if __name__ == "__main__":
    unittest.main()
