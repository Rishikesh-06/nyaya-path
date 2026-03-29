// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { ethers } from "https://esm.sh/ethers@6.11.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CASE_STORAGE_ABI = [
  "function storeHash(uint256 caseId, bytes32 hash) public"
];

function uuidToUint256(uuid: string): bigint {
  const hex = uuid.replace(/-/g, '');
  return BigInt('0x' + hex);
}

// Generate deterministic hash
async function generateCaseHash(data: any): Promise<string> {
  const normalizedData = {
    case_id: data.id.trim(),
    created_at: data.created_at.trim(),
    description: data.description.trim(),
    title: data.title.trim(),
    user_id: (data.victim_id || data.user_id).trim()
  };
  const jsonString = JSON.stringify(normalizedData);
  const encoder = new TextEncoder();
  const dataByte = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataByte);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { caseId } = await req.json()
    if (!caseId) throw new Error("Missing caseId");

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch the case data
    const { data: caseData, error } = await supabase.from('cases').select('*').eq('id', caseId).single()
    if (error || !caseData) throw new Error("Case not found");

    // Generate Hash
    const caseHash = await generateCaseHash(caseData)

    // Initial Database Update
    await supabase.from('cases').update({
      case_hash: caseHash,
      blockchain_status: 'pending',
      integrity_status: 'valid' // assumes originally valid
    }).eq('id', caseId)

    // Initialize Blockchain connection
    const rpcUrl = Deno.env.get('POLYGON_RPC_URL')
    const privateKey = Deno.env.get('PRIVATE_KEY')
    const contractAddress = Deno.env.get('CONTRACT_ADDRESS')

    if (!rpcUrl || !privateKey || !contractAddress) {
       console.error("Missing blockchain env variables");
       throw new Error("Server configuration error");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, CASE_STORAGE_ABI, wallet);

    try {
      const numericId = uuidToUint256(caseId);
      const tx = await contract.storeHash(numericId, caseHash);
      
      // Wait for confirmation
      const receipt = await tx.wait();

      // On success, update DB
      await supabase.from('cases').update({
        blockchain_status: 'confirmed',
        blockchain_tx_hash: receipt?.hash
      }).eq('id', caseId)

      return new Response(JSON.stringify({ success: true, txHash: receipt?.hash }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } catch (bcError: any) {
      console.error("Blockchain transaction failed:", bcError)
      
      // On failure, update DB
      await supabase.from('cases').update({
        blockchain_status: 'failed'
      }).eq('id', caseId)
      
      return new Response(JSON.stringify({ error: "Blockchain integration failed", details: bcError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
