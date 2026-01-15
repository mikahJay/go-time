import matcher as matcher_mod
from matcher import ResourceMatcher


def test_match_pipeline_calls_components(monkeypatch):
    # Prevent real pgvector registration
    monkeypatch.setattr(matcher_mod, "register_vector", lambda conn: None)

    class DummyConn:
        pass

    rm = ResourceMatcher(DummyConn(), anthropic_key="fakekey")

    called = {}

    def fake_get_need(nid):
        called["get_need"] = nid
        return {"id": nid, "description": "a need"}

    def fake_find_candidates(nid, top_k=20):
        called["find_candidates"] = (nid, top_k)
        return [("r1", "desc", {"meta": "v"})]

    def fake_reason_about(need, candidates):
        called["reason_about_matches"] = True
        return [{"id": "r1", "feasibility": 95}]

    rm._get_need = fake_get_need
    rm.find_candidates = fake_find_candidates
    rm.reason_about_matches = fake_reason_about

    result = rm.match(7)

    assert result == [{"id": "r1", "feasibility": 95}]
    assert called["get_need"] == 7
    assert called["find_candidates"] == (7, 20)
    assert called.get("reason_about_matches") is True
