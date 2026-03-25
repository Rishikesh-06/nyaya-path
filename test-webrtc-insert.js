const URL = "https://cavbavqglivytnpesage.supabase.co";
const ANON_KEY = "sb_publishable_jBNgvHxruPMP06wS5AMpRQ_Nsoefuug";

async function testInsert() {
  const url = `${URL}/rest/v1/webrtc_signals`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      case_id: "123e4567-e89b-12d3-a456-426614174000",
      type: "test",
      data: {},
      from_role: "lawyer"
    })
  });
  
  if (!res.ok) {
    console.log("Error inserting:", await res.text());
  } else {
    console.log("Inserted successfully!");
  }
}

testInsert().catch(console.error);
