const URL = "https://cavbavqglivytnpesage.supabase.co";
const ANON_KEY = "sb_publishable_jBNgvHxruPMP06wS5AMpRQ_Nsoefuug";

async function checkSchema() {
  const url = `${URL}/rest/v1/webrtc_signals?limit=1`;
  const res = await fetch(url, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }});
  
  if (!res.ok) {
    console.log("Error fetching webrtc_signals:", await res.text());
  } else {
    const data = await res.json();
    console.log("webrtc_signals data sample:", data);
  }
}

checkSchema().catch(console.error);
