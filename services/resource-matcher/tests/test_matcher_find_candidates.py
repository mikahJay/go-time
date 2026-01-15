import matcher as matcher_mod
from matcher import ResourceMatcher


def test_find_candidates_executes_query(monkeypatch):
    # Prevent real pgvector registration
    monkeypatch.setattr(matcher_mod, "register_vector", lambda conn: None)

    recorded = {}

    class FakeCursor:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def execute(self, sql, params):
            recorded["sql"] = sql
            recorded["params"] = params

        def fetchall(self):
            return [("r1", "a description", {"meta": "v"})]

    class FakeConn:
        def cursor(self):
            return FakeCursor()

    rm = ResourceMatcher(FakeConn(), anthropic_key=None)
    results = rm.find_candidates(42, top_k=5)

    assert results == [("r1", "a description", {"meta": "v"})]
    assert recorded["params"] == (42, 5)
    assert "SELECT r.id" in recorded["sql"]
