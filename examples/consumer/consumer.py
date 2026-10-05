# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


class CitedBoard(gl.Contract):
    citation_court_address: Address
    posts: TreeMap[str, str]
    meta: TreeMap[str, str]

    def __init__(self, citation_court_address_str: str):
        self.citation_court_address = Address(citation_court_address_str)

    def _ensure_meta_init(self) -> None:
        if "next_id" not in self.meta:
            self.meta["next_id"] = "1"
        if "recent" not in self.meta:
            self.meta["recent"] = "[]"

    @gl.public.write
    def post(self, claim_id: str, headline: str) -> str:
        self._ensure_meta_init()
        hl = str(headline).strip()
        if not (5 <= len(hl) <= 200):
            raise gl.vm.UserError("headline length must be between 5 and 200 chars")

        cid = str(claim_id).strip()
        court = gl.get_contract_at(self.citation_court_address)
        raw_ruling = court.view().get_ruling(cid)

        if not raw_ruling:
            raise gl.vm.UserError("claim has no ruling in CitationCourt")

        try:
            ruling = json.loads(raw_ruling)
            verdict = ruling.get("verdict", "")
        except Exception:
            raise gl.vm.UserError("failed to decode ruling")

        if verdict != "SUPPORTS":
            raise gl.vm.UserError("claim ruling is not SUPPORTS: " + verdict)

        author = gl.message.sender_address.as_hex
        post_id = self.meta["next_id"]
        next_num = int(post_id) + 1
        self.meta["next_id"] = str(next_num)

        post_record = {
            "post_id": post_id,
            "claim_id": cid,
            "headline": hl,
            "author": author,
        }
        self.posts[post_id] = json.dumps(post_record, sort_keys=True, separators=(",", ":"))

        # Update recent posts index
        recent = json.loads(self.meta["recent"])
        recent.insert(0, post_id)
        if len(recent) > 50:
            recent = recent[:50]
        self.meta["recent"] = json.dumps(recent)

        return post_id

    @gl.public.view
    def get_post(self, post_id: str) -> str:
        pid = str(post_id).strip()
        return self.posts.get(pid, "")

    @gl.public.view
    def list_posts(self, limit: int = 10) -> str:
        if "recent" not in self.meta:
            return "[]"
        try:
            items = json.loads(self.meta["recent"])
            bounded_limit = min(max(1, int(limit)), 20)
            return json.dumps(items[:bounded_limit])
        except Exception:
            return "[]"
