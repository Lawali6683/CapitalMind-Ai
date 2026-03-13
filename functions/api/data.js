export async function onRequest(context) {
  const { request } = context;
  
  const origin = request.headers.get("Origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
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

    const OPENROUTER_API_KEY = "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";
    const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

    const promptText = `
      Act as a Fintech AI Consultant.
      Inputs:
      Capital: ${capital}
      Location: ${loc}
      Business Idea: ${desc}

      Language Rule:
      If user writes in Hausa, reply in Hausa.
      If user writes in English, reply in English.

      Provide:
      1. Recommendation
      2. Profit Estimate
      3. Risk Level
      4. Local Market Steps
      Format using bold headers and clean bullet points.
    `;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://capitalmindai.pages.dev", // Optional
        "X-Title": "CapitalMind AI" // Optional
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional Fintech Consultant." },
          { role: "user", content: promptText }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "OpenRouter API Error");
    }

    const aiText = data.choices[0].message.content;

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
