/**
 * v1.7 Sprint G — per-stage explainer content (lock #27).
 * Each entry rendered in the pipeline-tracker explainer card while that
 * stage is active. Educational + contextual + tied to live state.
 */
export const STAGE_EXPLAINERS: Record<string, { title: string; body: string }> = {
  expanding: {
    title: 'Generating query variants',
    body: 'Your question is being rewritten into 3 angles — the original phrasing plus 2 variants that approach the topic from different directions (e.g. a diagnostic angle and a management angle). Running 3 searches in parallel catches relevant material that the original wording alone would miss.',
  },
  variants: {
    title: 'Query variants generated',
    body: 'Each variant will now independently search the database. The result sets are unioned, deduplicated, and the highest-scoring matches across all queries are kept.',
  },
  retrieving: {
    title: 'Hybrid retrieval',
    body: 'Running hybrid search across the database — vector similarity (semantic match via 1024-dim embeddings) plus BM25 keyword search, combined by Reciprocal Rank Fusion. The pool of ~190,000 indexed text chunks is narrowed to the most relevant 30.',
  },
  reranking: {
    title: 'Cross-encoder reranking',
    body: 'A second model is re-scoring the top results against your question. Vector search is fast at finding candidates but isn’t great at ranking them — the reranker takes 30 candidates, scores each (question, candidate) pair, and keeps the top 8. This is where retrieval quality often comes from.',
  },
  fusing: {
    title: 'Source-quality fusion',
    body: 'Each retained chunk is weighted by source quality — board-review textbooks weighted higher than secondary references, longer focused passages weighted higher than fragments. The final sort applies this weight before the answer-writing model sees them.',
  },
  drafting: {
    title: 'Drafting answer',
    body: 'The reasoning model is writing the first draft of your answer, citing every clinical claim against the source chunks shown above. This is the slowest single step — large model, long context window, careful generation.',
  },
  reviewing: {
    title: 'Auditing draft',
    body: 'The draft is being audited by a second model that looks for unsupported claims, missing caveats, clinical errors, and citation problems. If it finds issues, the draft will be revised. If the draft is clean, you see it as-is.',
  },
  revising: {
    title: 'Revising draft',
    body: 'The audit found issues. The audit model is now rewriting the draft to fix every flagged problem while preserving the parts that were correct. The revised answer replaces the draft that streamed earlier.',
  },
  generating: {
    title: 'Generating answer',
    body: 'The reasoning model is writing your answer in one pass, citing every clinical claim against the source chunks. (Self-critique is off — no audit step will follow.)',
  },
  finalizing: {
    title: 'Finalizing answer',
    body: 'Final formatting and persistence of the answer to your trace history.',
  },
  parsing: { title: 'Parsing response', body: 'Parsing the model’s structured response.' },
  persisting: { title: 'Saving trace', body: 'Persisting the full pipeline trace for forensic review.' },
  done: { title: 'Done', body: '' },
};
