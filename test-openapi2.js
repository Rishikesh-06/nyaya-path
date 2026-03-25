import fs from 'fs';
const URL = "https://cavbavqglivytnpesage.supabase.co";
const ANON_KEY = "sb_publishable_jBNgvHxruPMP06wS5AMpRQ_Nsoefuug";

async function getSpec() {
  try {
    const res = await fetch(`${URL}/rest/v1/?apikey=${ANON_KEY}`);
    const spec = await res.json();
    
    // Write entire spec to a file so we can look at it manually
    fs.writeFileSync('openapi-full.json', JSON.stringify(spec, null, 2));
    
    // Try to find the mentorship_messages table specifically
    const defs = spec.definitions || spec.components?.schemas || {};
    const tableNames = Object.keys(defs);
    
    const targetTable = defs["mentorship_messages"];
    
    console.log("Available tables count:", tableNames.length);
    if (targetTable) {
      console.log("Table mentorship_messages properties:", Object.keys(targetTable.properties || {}));
    } else {
      console.log("Table mentorship_messages NOT FOUND in the OpenAPI spec definitions.");
      console.log("Here are tables containing 'message':", tableNames.filter(n => n.includes('message')));
    }
  } catch (err) {
    console.error("Script error:", err);
  }
}

getSpec();
