const URL = "https://cavbavqglivytnpesage.supabase.co";
const ANON_KEY = "sb_publishable_jBNgvHxruPMP06wS5AMpRQ_Nsoefuug";

async function testQuery() {
  const url = `${URL}/rest/v1/users?select=*,lawyer_scores(total_score,cases_won,avg_rating)&role=eq.lawyer&order=created_at.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`
    }
  });
  const data = await res.json();
  console.log("Is array?", Array.isArray(data[0]?.lawyer_scores));
}

testQuery().catch(console.error);
