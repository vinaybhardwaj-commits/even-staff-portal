/**
 * v1.6 P2: embedding upgrade + source-quality precompute.
 *
 * 1. ADD COLUMN embedding_v2 vector(1024) — for mxbai-embed-large (1024-dim,
 *    drop-in replacement for nomic-embed-text (768-dim) via Ollama).
 * 2. ADD COLUMN source_quality_weight REAL DEFAULT 1.0 — precomputed per-chunk
 *    fusion weight derived from book / chunk_type / token_count. Backfilled
 *    by the reindex endpoint AND on every retrieve-time INSERT (trigger).
 * 3. IVFFlat index on embedding_v2 once backfill completes (separate call —
 *    can't build over an all-NULL column).
 *
 * Backwards-compatible: old `embedding` column stays in place. retrieve() reads
 * embedding_v2 only when USE_EMBEDDING_V2 env flag is true.
 */
export const v12_sql = `
  ALTER TABLE mksap_chunks
    ADD COLUMN IF NOT EXISTS embedding_v2 vector(1024);
  ALTER TABLE mksap_chunks
    ADD COLUMN IF NOT EXISTS source_quality_weight REAL DEFAULT 1.0;
`;

/**
 * Build the IVFFlat index. Call ONLY after the reindex backfill is complete
 * (otherwise the cluster centroids are derived from NULLs / few rows).
 * Lists rule of thumb: sqrt(rows). For ~20k chunks → lists=140.
 */
export const v12_index_sql = `
  CREATE INDEX IF NOT EXISTS idx_mksap_chunks_embedding_v2
    ON mksap_chunks USING ivfflat (embedding_v2 vector_cosine_ops) WITH (lists = 100);
`;
