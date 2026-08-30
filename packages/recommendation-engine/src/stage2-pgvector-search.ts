// =============================================================================
// Stage 2: pgvector Semantic Similarity Search
// Narrows eligible trades to top 5–15 semantically closest to beneficiary
// skills and interests (Section 9, Stage 2 of PRD).
// Uses Gemini text-embedding-004 for 768-dimension embeddings.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NSQFTrade, ConfirmedProfile } from '@kural-sevi/shared';

const EMBEDDING_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

/**
 * Build a text representation of the beneficiary's skills and interests
 * for embedding. Rich context improves similarity quality.
 */
export function buildSkillsText(profile: ConfirmedProfile): string {
  const parts: string[] = [];

  if (profile.skills_and_interests) {
    const s = profile.skills_and_interests;
    if (s.existing_skills?.length) parts.push(`Skills: ${s.existing_skills.join(', ')}`);
    if (s.informal_skills?.length) parts.push(`Informal skills: ${s.informal_skills.join(', ')}`);
    if (s.traditional_skills?.length) parts.push(`Traditional skills: ${s.traditional_skills.join(', ')}`);
    if (s.interests?.length) parts.push(`Interests: ${s.interests.join(', ')}`);
    if (s.prior_training_details) parts.push(`Prior training: ${s.prior_training_details}`);
  }

  if (profile.family_occupation) {
    const f = profile.family_occupation;
    if (f.occupation) parts.push(`Family occupation: ${f.occupation}`);
    if (f.is_traditional) parts.push('Traditional family livelihood');
    if (f.transferable_skills?.length) {
      parts.push(`Transferable family skills: ${f.transferable_skills.join(', ')}`);
    }
  }

  if (profile.current_livelihood) {
    const c = profile.current_livelihood;
    if (c.activity) parts.push(`Current work: ${c.activity}`);
    if (c.income_stability) parts.push(`Livelihood stability: ${c.income_stability}`);
  }

  if (profile.employment_preference) {
    parts.push(`Prefers: ${profile.employment_preference} employment`);
  }

  return parts.join('. ') || 'General livelihood development';
}

/**
 * Generate 768-dimension embedding using Gemini text-embedding-004.
 */
export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(`${EMBEDDING_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text }] },
      taskType: 'SEMANTIC_SIMILARITY',
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as { embedding: { values: number[] } };
  return data.embedding.values;
}

export interface SimilarTrade extends NSQFTrade {
  similarity: number;
}

/**
 * Stage 2: Use pgvector to find semantically similar trades.
 * Returns top-K trades with similarity scores.
 */
export async function findSimilarTrades(
  profile: ConfirmedProfile,
  eligibleQpCodes: string[], // From Stage 1 hard filter
  supabase: SupabaseClient,
  apiKey: string,
  topK: number = 15
): Promise<SimilarTrade[]> {
  const skillsText = buildSkillsText(profile);

  // Generate embedding for the beneficiary's skill profile
  const embedding = await generateEmbedding(skillsText, apiKey);

  // Determine NSQF level range from education
  const completedYears = profile.educational_background?.completed_years ?? 0;
  let maxNsqfLevel = 10;
  let minNsqfLevel = 1;

  if (completedYears <= 5) {
    maxNsqfLevel = 3; // Cap at NSQF Level 3 for very limited education
  } else if (completedYears <= 10) {
    maxNsqfLevel = 5;
  }

  // Call the pgvector function in Supabase
  const { data, error } = await supabase.rpc('find_similar_trades', {
    query_embedding: embedding,
    top_k: topK,
    exclude_qp_codes: [], // We pass all codes and filter in-app to respect eligibleQpCodes
    min_nsqf_level: minNsqfLevel,
    max_nsqf_level: maxNsqfLevel,
  });

  if (error) {
    throw new Error(`pgvector search failed: ${error.message}`);
  }

  const results = (data as SimilarTrade[]) || [];

  // Filter to only eligible codes from Stage 1
  const eligibleSet = new Set(eligibleQpCodes);
  return results.filter(t => eligibleSet.has(t.qp_code));
}
