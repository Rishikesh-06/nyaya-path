const URL = "https://cavbavqglivytnpesage.supabase.co";
const ANON_KEY = "sb_publishable_jBNgvHxruPMP06wS5AMpRQ_Nsoefuug";

async function verifySchema() {
  const url = `${URL}/rest/v1/mentorship_messages?limit=1`;
  const res = await fetch(url, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Prefer": "return=representation" }});
  
  if (!res.ok) {
    console.error("Error fetching:", await res.text());
  } else {
    const data = await res.json();
    console.log("Empty data array returned:", data);
  }

  // Also try inserting to see the exact error
  const insertUrl = `${URL}/rest/v1/mentorship_messages`;
  const insertRes = await fetch(insertUrl, {
    method: 'POST',
    headers: { 
      apikey: ANON_KEY, 
      Authorization: `Bearer ${ANON_KEY}`, 
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      mentorship_id: "123e4567-e89b-12d3-a456-426614174000",
      sender_id: "123e4567-e89b-12d3-a456-426614174000",
      content: "Test"
    })
  });
  
  const insertText = await insertRes.text();
  console.log("Insert attempt response:", insertRes.status, insertText);
}

verifySchema().catch(console.error);
