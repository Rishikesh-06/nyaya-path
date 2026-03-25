const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// @ts-ignore
Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, documentAnalysis, city, category, language } = await req.json();
    const targetLang = language || 'English';
    // @ts-ignore
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a legal case anonymization system. Take this case information and create a completely anonymous case summary. Remove all personal identifiers including names, exact addresses, phone numbers, email addresses, ID numbers. Keep only: city name, general area of law, core facts of the dispute, strength of evidence. The summary must protect the victim's identity completely while giving lawyers enough information to assess the case. Maximum 100 words. Respond in plain text only. Do not use any markdown formatting, asterisks, bold, italic, or special characters.
    
CRITICAL INSTRUCTION: Generate the entire summary STRICTLY in ${targetLang}. Do not use English if ${targetLang} is not English. Maintain professional legal clarity and natural readability in ${targetLang}.`;

    const userContent = `Category: ${category || 'General'}\nCity: ${city || 'Unknown'}\nDescription: ${description || 'No description provided'}\n${documentAnalysis ? `Document Analysis: ${JSON.stringify(documentAnalysis)}` : ''}`;

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
          { role: "user", content: userContent }
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || 'Unable to generate summary.';

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Summary error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate summary' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
