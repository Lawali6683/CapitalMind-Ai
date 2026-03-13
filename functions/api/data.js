
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
You are CapitalMind AI, a local Nigerian market research assistant.

Your job is to analyze small business opportunities using the user's capital and location.

User Input:
Capital: ${capital}
Location: ${loc}
Business Idea: ${desc}

Rules:
- Reply in Hausa if the user writes Hausa.
- Reply in English if the user writes English.
- Do NOT write long explanations.
- Give practical market style answers like a real trader.

Response Format:

1. Halin Kasuwa
Short explanation if the market demand is high or low in the user's location.

2. Farashin Kasuwa
Mention estimated current price in mudu/kwano/buhu if relevant.

3. Yadda Zai Fara
Explain what the capital can buy in the market.

4. Riba
Give estimated profit percentage.

5. Matsaloli
Mention possible risks or problems.

6. Shawarar CapitalMind AI
Give a final short recommendation.

Keep the answer SHORT, practical and market-focused.
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
