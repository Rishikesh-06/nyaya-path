import fs from 'fs';
const URL = "https://cavbavqglivytnpesage.supabase.co";
const ANON_KEY = "sb_publishable_jBNgvHxruPMP06wS5AMpRQ_Nsoefuug";

async function probe() {
  const payloads = [
    { intern_id: "123e4567-e89b-12d3-a456-426614174000", sender_id: "123e4567-e89b-12d3-a456-426614174000", content: "Test" },
    { mentorship_id: "123e4567-e89b-12d3-a456-426614174000", sender_id: "123e4567-e89b-12d3-a456-426614174000", content: "Test" },
    { internId: "123e4567-e89b-12d3-a456-426614174000", sender_id: "123e4567-e89b-12d3-a456-426614174000", content: "Test" }
  ];

  const results = {};
  for (const p of payloads) {
    const res = await fetch(`${URL}/rest/v1/mentorship_messages`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(p)
    });
    results[Object.keys(p)[0]] = { status: res.status, error: await res.text() };
  }
  fs.writeFileSync('probe-results.json', JSON.stringify(results, null, 2));
}

probe().catch(console.error);
