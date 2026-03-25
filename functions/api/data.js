
export async function onRequest(context) {
  const { request, env } = context;

  const origin = request.headers.get("Origin") || "*";

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const { capital, loc, desc, password } = await request.json();

    if (password !== "@haruna66") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API Key missing in Cloudflare Dashboard" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const promptText = `
You are CapitalMind AI, an elite market analyst. 
Your goal is to provide high-accuracy business intelligence.

USER INPUT:
- Capital: ₦${capital}
- Location: ${loc}
- Business Query: ${desc}

STRICT OPERATIONAL RULES:
1. LANGUAGE MATCHING: Respond ONLY in the language used by the user in the "Business Query". If they ask in English, use English for headings and content. If in Hausa, use Hausa.
2. AMBIGUITY CHECK: If a user mentions a word that has multiple meanings (e.g., "Leda", "Kafa"), analyze the context of "Business" and "Market". If still unclear, ask for clarification instead of guessing.
3. PRICE ACCURACY: Do not give fixed prices. Use phrases like "As of current market trends, it's approximately..." or "Prices fluctuate, but expect around...". If you are unsure of a specific price, say: "I don't have the exact current price due to market volatility, but for estimation, let's use ₦10."
4. LOGISTICS ADVICE: Since you don't know the user's exact street, provide relative logistics advice. Example: "If you are close to the main market, transport costs will be minimal (approx ₦200-₦500), but factor in more if you are on the outskirts."

RESPONSE STRUCTURE (Translate headings to match user language):
1. Market Condition (Halin Kasuwa)
2. Current Valuation (Kimanin Farashi)
3. Inventory Strategy (Yadda Zaka Fara)
4. Profit Projection (Hasashen Riba)
5. Risk Assessment (Abubuwan Dubawa)
6. Final Strategic Advice (Shawarar CapitalMind AI)
`;


    const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText }
            ]
          }
        ]
      })
    });

    const data = await geminiResponse.json();

    if (data.error) {
      throw new Error(data.error.message || "Gemini API Error");
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    return new Response(
      JSON.stringify({ text: aiText }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
