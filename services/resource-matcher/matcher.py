try:
    from anthropic import Anthropic
except Exception:
    class Anthropic:
        def __init__(self, api_key=None):
            self.api_key = api_key
            class _Messages:
                def create(self, *a, **k):
                    raise RuntimeError("Anthropic client not available in test environment")
            self.messages = _Messages()

try:
    import psycopg2
except Exception:
    psycopg2 = None

try:
    from pgvector.psycopg2 import register_vector
except Exception:
    def register_vector(conn):
        return None

class ResourceMatcher:
    def __init__(self, db_conn, anthropic_key):
        self.conn = db_conn
        self.client = Anthropic(api_key=anthropic_key)
        register_vector(self.conn)
    
    def embed_text(self, text):
        # Use OpenAI embeddings or similar
        # Return vector representation
        pass
    
    def find_candidates(self, need_id, top_k=20):
        """Phase 1: Vector similarity search"""
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT r.id, r.description, r.metadata,
                       1 - (r.embedding <=> n.embedding) as similarity
                FROM resources r, needs n
                WHERE n.id = %s
                ORDER BY r.embedding <=> n.embedding
                LIMIT %s
            """, (need_id, top_k))
            return cur.fetchall()
    
    def reason_about_matches(self, need, candidates):
        """Phase 2: LLM reasoning"""
        prompt = f"""
        I have a NEED: {need['description']}
        Context: {need['metadata']}
        
        Here are potential RESOURCES that might help:
        {self._format_candidates(candidates)}
        
        For each resource, assess:
        1. Feasibility (0-100): Can this resource actually address the need?
        2. Explanation: Why or why not?
        3. Blockers: What obstacles exist?
        4. Creative solutions: Any non-obvious ways to use this?
        
        Return as JSON array ordered by feasibility.
        """
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return self._parse_matches(response.content)
    
    def match(self, need_id):
        """Full matching pipeline"""
        need = self._get_need(need_id)
        candidates = self.find_candidates(need_id)
        matches = self.reason_about_matches(need, candidates)
        return matches