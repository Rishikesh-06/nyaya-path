const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = '';
    switch (tool) {
      case 'case_researcher':
        systemPrompt = `You are an expert Indian legal researcher. Given a legal question, provide:\n1. Relevant IPC/BNS sections\n2. Applicable Acts and their specific sections\n3. 3-5 relevant Indian court case precedents with citations (case name, year, court)\n4. A brief strategic analysis\n\nBe precise with section numbers and case citations. Format with clear headings.`;
        break;
      case 'document_drafter':
        systemPrompt = `You are an expert Indian legal document drafter. Based on the description, generate a professional legal document draft. Include:\n- Proper legal format and structure\n- Relevant legal references and sections\n- Formal language appropriate for Indian courts\n- All necessary sections (parties, subject, body, prayer/request)\n\nGenerate the complete document text ready to be used.`;
        break;
      case 'precedent_finder':
        systemPrompt = `You are an expert Indian legal precedent researcher. Based on the case facts described, find and present the 5 most relevant Indian court judgments. For each:\n1. Full case citation (Name vs Name, Year, Court)\n2. Key legal principle established\n3. How it applies to the described facts\n4. Outcome of the case\n\nPrioritize Supreme Court and High Court judgments.`;
        break;
      case 'judge_intelligence':
        systemPrompt = `You are an expert court analytics system for Indian judiciary. Given a judge's name and court, provide:\n1. Known judicial philosophy/approach\n2. Notable judgments and their outcomes\n3. Patterns in sentencing/rulings for similar cases\n4. Key observations for lawyers appearing before this judge\n5. Areas of legal interest or expertise\n\nProvide actionable intelligence for courtroom preparation.`;
        break;
      default:
        systemPrompt = 'You are a helpful Indian legal assistant.';
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('AI Toolkit error:', error);
    return new Response(JSON.stringify({ error: 'AI Toolkit request failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
