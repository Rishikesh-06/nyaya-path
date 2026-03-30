import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env 

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generateNodeCaseHash(data: {
  title: string;
  description: string;
  user_id: string;
  created_at: string;
}): string {
  const normalizedData = {
    created_at: data.created_at ? new Date(data.created_at).toISOString() : '',
    description: (data.description || '').trim(),
    title: (data.title || '').trim(),
    user_id: String(data.user_id || '').trim()
  };

  const jsonString = JSON.stringify(normalizedData);
  const hashHex = crypto.createHash('sha256').update(jsonString).digest('hex');
  return '0x' + hashHex;
}

async function backfill() {
  console.log("Fetching cases with missing case_hash...");
  
  const { data: cases, error } = await supabase
    .from('cases')
    .select('id, title, description, victim_id, user_id, created_at, case_hash')
    .is('case_hash', null);

  if (error) {
    console.error("Error fetching cases:", error);
    process.exit(1);
  }

  if (!cases || cases.length === 0) {
    console.log("No cases found with missing case_hash. All good!");
    return;
  }

  console.log(`Found ${cases.length} cases to backfill.`);

  for (const c of cases) {
    const userId = c.victim_id || c.user_id; // try both based on schema
    if (!userId) {
      console.log(`Skipping case ${c.id}: No valid user mapping found.`);
      continue;
    }

    const recomputedHash = generateNodeCaseHash({
      title: c.title,
      description: c.description,
      user_id: userId,
      created_at: c.created_at
    });

    const { error: updateError } = await supabase
      .from('cases')
      .update({ case_hash: recomputedHash, integrity_status: 'valid' })
      .eq('id', c.id);

    if (updateError) {
      console.error(`Failed to update case ${c.id}:`, updateError);
    } else {
      console.log(`Successfully updated case ${c.id}`);
    }
  }

  console.log("Backfill complete!");
}

backfill();
