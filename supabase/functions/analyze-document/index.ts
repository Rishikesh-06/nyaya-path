const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      Telugu: `మీరు భారతదేశంలో 20 సంవత్సరాల అనుభవం ఉన్న సీనియర్ న్యాయవాది. పూర్తిగా తెలుగులో మాత్రమే సమాధానం ఇవ్వండి. ఒక్క ఇంగ్లీష్ పదం వాడవద్దు.

పత్రాన్ని చాలా జాగ్రత్తగా చదివి విశ్లేషించండి. సాధారణ వ్యక్తికి పూర్తిగా అర్థమయ్యేలా, ఆచరణాత్మకంగా వివరించండి.

శుద్ధమైన JSON మాత్రమే ఇవ్వండి — markdown లేదా backticks వద్దు:
{
  "document_type": "పత్రం యొక్క అసలు రకం తెలుగులో",
  "plain_summary": "ఈ పత్రం ఏమిటో, ఎవరు పంపారో, దానిలో ఏమి కోరుతున్నారో, మీరు స్పందించకపోతే ఏమి జరుగుతుందో, మీరు ముందుగా ఏమి చేయాలో — ఇవన్నీ 4-5 వాక్యాలలో సరళమైన తెలుగులో వివరించండి",
  "rights": [
    "మీకు ఉన్న మొదటి హక్కు — ఏ భారతీయ చట్టం సెక్షన్ కింద అనే వివరణతో సహా",
    "మీకు ఉన్న రెండవ హక్కు — ఆచరణాత్మక సలహాతో",
    "మీకు ఉన్న మూడవ హక్కు — ఏమి చేయవచ్చో వివరణతో",
    "మీకు ఉన్న నాల్గవ హక్కు — దీన్ని ఎలా ఉపయోగించుకోవాలో"
  ],
  "deadlines": [
    "మొదటి గడువు — ఎన్ని రోజులు మరియు దాటితే ఏమవుతుందో",
    "రెండవ గడువు ఉంటే — దాని వివరాలు మరియు ప్రాముఖ్యత"
  ],
  "missing_evidence": [
    "మీ కేసు బలపరచడానికి వెంటనే సేకరించాల్సిన సాక్ష్యం 1",
    "మీ కేసు బలపరచడానికి వెంటనే సేకరించాల్సిన సాక్ష్యం 2",
    "సహాయపడే సాక్షులు లేదా పత్రాలు"
  ],
  "case_strength": 75,
  "case_strength_explanation": "కేసు బలం వివరణ తెలుగులో"
}`,

      Hindi: `आप भारत में 20 साल के अनुभव वाले वरिष्ठ वकील हैं। केवल और केवल हिंदी में जवाब दें। एक भी अंग्रेजी शब्द न लिखें।

दस्तावेज़ को बहुत ध्यान से पढ़कर विश्लेषण करें। आम आदमी को पूरी तरह समझ आए और वो तुरंत कार्रवाई कर सके ऐसे व्यावहारिक तरीके से समझाएं।

केवल शुद्ध JSON दें — कोई markdown या backticks नहीं:
{
  "document_type": "दस्तावेज़ का असली प्रकार हिंदी में",
  "plain_summary": "यह दस्तावेज़ क्या है, किसने भेजा, क्या मांग रहे हैं, जवाब न दिया तो क्या होगा, सबसे पहले क्या करना चाहिए — यह सब 4-5 वाक्यों में सरल हिंदी में बताएं",
  "rights": [
    "पहला अधिकार — किस भारतीय कानून की धारा के तहत है, विस्तार से",
    "दूसरा अधिकार — व्यावहारिक सलाह के साथ",
    "तीसरा अधिकार — क्या कार्रवाई कर सकते हैं",
    "चौथा अधिकार — इसे कैसे इस्तेमाल करें"
  ],
  "deadlines": [
    "पहली समय सीमा — कितने दिन और चूकने पर क्या होगा",
    "दूसरी समय सीमा अगर है — विवरण और महत्व"
  ],
  "missing_evidence": [
    "केस मजबूत करने के लिए तुरंत जुटाएं — साक्ष्य 1",
    "केस मजबूत करने के लिए तुरंत जुटाएं — साक्ष्य 2",
    "मददगार गवाह या दस्तावेज़"
  ],
  "case_strength": 75,
  "case_strength_explanation": "मामले की ताकत का स्पष्टीकरण हिंदी में"
}`,

      English: `You are a senior Indian lawyer with 20 years of experience in all areas of Indian law. Analyze the document extremely carefully and provide practical, accurate, actionable advice that a common person can understand and act on immediately.

Respond ONLY with clean JSON — absolutely no markdown, no backticks, no text outside the JSON:
{
  "document_type": "exact legal document type",
  "plain_summary": "4-5 sentences covering: what this document is, who sent it and why, exactly what they are demanding, what happens if you ignore it or miss deadlines, and what your very first action should be",
  "rights": [
    "First right with specific Indian law section number and how it protects you",
    "Second right with practical step-by-step explanation of how to use it",
    "Third right with specific action you can take within the next 7 days",
    "Fourth right with information about free legal aid if applicable"
  ],
  "deadlines": [
    "First critical deadline — exact number of days, what triggers it, and consequence of missing it",
    "Second deadline if present — details and why it matters"
  ],
  "missing_evidence": [
    "First piece of evidence to gather immediately — where to get it and why it helps",
    "Second document or record to collect — specific source and impact on case",
    "Witnesses or digital records that would strengthen your position"
  ],
  "case_strength": 75,
  "case_strength_explanation": "One sentence explaining the case strength score"
}`,
    };

    const systemPrompt = systemPrompts[language] || systemPrompts['English'];

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
          { role: "user", content: documentText || "No document text provided." }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '{}';
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const analysis = JSON.parse(content);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze document' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
