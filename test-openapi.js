import fs from 'fs';
const URL = "https://cavbavqglivytnpesage.supabase.co";
const ANON_KEY = "sb_publishable_jBNgvHxruPMP06wS5AMpRQ_Nsoefuug";

async function getSpec() {
  const res = await fetch(`${URL}/rest/v1/?apikey=${ANON_KEY}`);
  const spec = await res.json();
  const defs = Object.keys(spec.definitions || spec.components?.schemas || {});
  
  const mentorshipTable = (spec.definitions || spec.components?.schemas)["mentorship_messages"] || null;
  
  fs.writeFileSync('openapi-tables.json', JSON.stringify({ available_tables: defs, mentorship_table_spec: mentorshipTable }, null, 2));
}

getSpec().catch(console.error);
