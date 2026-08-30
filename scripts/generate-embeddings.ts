#!/usr/bin/env tsx
/**
 * Kural Sevi — Generate pgvector embeddings for the NSQF catalog.
 * Run once after seeding the catalog, then after any catalog updates.
 * Uses Gemini text-embedding-004 (768 dimensions).
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY!;

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        taskType: 'SEMANTIC_SIMILARITY',
      }),
    }
  );
  const data = await response.json() as any;
  return data.embedding.values;
}

function buildTradeText(trade: any): string {
  return [
    trade.qp_name,
    `Sector: ${trade.sector}`,
    `NSQF Level ${trade.nsqf_level}`,
    trade.description ?? '',
    trade.required_skills?.length ? `Required skills: ${trade.required_skills.join(', ')}` : '',
    trade.skills_acquired?.length ? `Skills gained: ${trade.skills_acquired.join(', ')}` : '',
    `Employment type: ${trade.pathway_type}`,
  ].filter(Boolean).join('. ');
}

async function main() {
  console.log('Generating embeddings for NSQF catalog...');
  
  const { data: trades, error } = await supabase
    .from('nsqf_catalog')
    .select('*')
    .is('trade_embedding', null);  // Only un-embedded

  if (error) throw error;
  
  console.log(`Found ${trades?.length ?? 0} trades without embeddings`);
  
  for (const trade of (trades ?? [])) {
    const text = buildTradeText(trade);
    console.log(`Embedding: ${trade.qp_code} — ${trade.qp_name}`);
    
    try {
      const embedding = await generateEmbedding(text);
      await supabase
        .from('nsqf_catalog')
        .update({ trade_embedding: embedding })
        .eq('qp_code', trade.qp_code);
      
      // Rate limit: Gemini free tier is 1500 RPM
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      console.error(`Failed for ${trade.qp_code}:`, e);
    }
  }
  
  console.log('Embedding generation complete!');
}

main().catch(console.error);
