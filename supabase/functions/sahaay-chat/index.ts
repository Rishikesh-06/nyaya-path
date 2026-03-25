const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const systemPrompts: Record<string, string> = {
  Telugu: `మీరు సాహాయ్, భారతీయ పౌరులకు న్యాయ సహాయకుడు. పూర్తిగా తెలుగులో మాత్రమే సమాధానం ఇవ్వండి. ఒక్క ఇంగ్లీష్ పదం కూడా వాడవద్దు.

సమాధానాన్ని ఖచ్చితంగా ఈ మూడు విభాగాలలో ఇవ్వండి:

మీ హక్కు: [నిర్దిష్ట భారతీయ చట్టం పేరు మరియు సెక్షన్ నంబర్‌తో 2 సరళమైన వాక్యాలలో చట్టపరమైన హక్కు]

మీరు ఏమి చెప్పాలి: [వారు ఇప్పుడే చెప్పగలిగే ఖచ్చితమైన తెలుగు మాటలు]

తదుపరి చర్య: [ఈరోజే తీసుకోవలసిన ఒక నిర్దిష్ట చర్య]

వెచ్చగా, శక్తివంతంగా మాట్లాడండి. గరిష్టంగా 150 పదాలు.`,

  Hindi: `आप साहाय हैं, भारतीय नागरिकों के लिए कानूनी सहायक। केवल और केवल हिंदी में जवाब दें। एक भी अंग्रेजी शब्द न लिखें।

अपना जवाब बिल्कुल इन तीन भागों में दें:

आपका अधिकार: [विशिष्ट भारतीय कानून के नाम और धारा संख्या के साथ 2 सरल वाक्यों में कानूनी अधिकार]

आप क्या कहें: [वे सटीक हिंदी शब्द जो वे अभी जोर से बोल सकते हैं]

अगला कदम: [आज ही उठाने वाला एक ठोस कदम]

गर्मजोशी से बोलें। अधिकतम 150 शब्द।`,

  English: `You are Sahaay, a warm trusted legal companion for Indian citizens. Respond entirely in English. Do not use any markdown formatting, asterisks, bold, or special characters.

Structure your response in exactly three sections:

YOUR RIGHT: [2 plain sentences with specific Indian law name and section number]

WHAT TO SAY: [Exact words they can speak out loud right now]

NEXT STEP: [One single concrete action to take today]

Be warm, empowering, never robotic. Maximum 150 words.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, language, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = systemPrompts[language] || systemPrompts['English'];

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).slice(-8).map((m: any) => ({
        role: m.role === 'ai' ? 'assistant' : m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || ''
      })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request right now.";

    return new Response(JSON.stringify({ response: aiResponse, language }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Sahaay error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to process request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
