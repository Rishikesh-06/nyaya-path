const URL = "https://cavbavqglivytnpesage.supabase.co";
const ANON_KEY = "sb_publishable_jBNgvHxruPMP06wS5AMpRQ_Nsoefuug";

async function verifyTable() {
  const url = `${URL}/rest/v1/mentorship_messages?select=*&limit=1`;
  const res = await fetch(url, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }});
  
  if (!res.ok) {
    console.error("Error fetching mentorship_messages:", await res.text());
  } else {
    const data = await res.json();
    console.log("Success! Table exists:", data);
  }
}

verifyTable().catch(console.error);
