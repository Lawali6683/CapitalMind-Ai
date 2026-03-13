export async function onRequest(context) {
  const { request } = context;
  
  const origin = request.headers.get("Origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { capital, loc, desc, password } = await request.json();

    if (password !== "@haruna66") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Tabbatar wannan Key din yana da kudi (credits) ko kuma yana aiki a OpenRouter
    const OPENROUTER_API_KEY = "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";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5", // Mun canza zuwa Gemini ta OpenRouter
        messages: [
          { role: "user", content: `Business Advice: Capital ₦${capital}, Location ${loc}, Idea: ${desc}. Reply in Hausa if needed.` }
        ]
      })
    });

    const data = await response.json();

    // Idan OpenRouter ya dawo da kuskure (kamar User not found)
    if (data.error) {
      return new Response(
        JSON.stringify({ error: `OpenRouter Error: ${data.error.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    const aiText = data.choices[0]?.message?.content || "No response from AI";

    return new Response(
      JSON.stringify({ text: aiText }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "System Error: " + err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}
