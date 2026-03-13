export async function onRequest(context) {
  const { request, env } = context;
  
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

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API Key missing in Cloudflare Dashboard" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const promptText = `
      Act as a Fintech AI Consultant.
      Inputs:
      Capital: ${capital}
      Location: ${loc}
      Business Idea: ${desc}
      Language Rule:
      If user writes in Hausa reply in Hausa.
      If user writes in English reply in English.
      Provide:
      1. Recommendation
      2. Profit Estimate
      3. Risk Level
      4. Local Market Steps
      Format using bold headers and clean bullet points.
    `;

const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    

    const geminiResponse = await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await geminiResponse.json();

    if (data.error) {
      throw new Error(data.error.message || "Gemini API Error");
    }

    const aiText = data.candidates[0].content.parts[0].text;

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
