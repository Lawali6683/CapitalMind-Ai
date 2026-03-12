import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequest(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "*";

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { capital, loc, desc, password } = await request.json();

    // Check Password
    if (password !== "@haruna66") {
      return new Response(JSON.stringify({ error: "Access Denied" }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Tabbatar akwai API Key
    if (!env.GEMINI_API_KEY) {
      throw new Error("API Key is missing in Cloudflare Dashboard!");
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Act as a Fintech AI Consultant.
      Inputs:
      Capital: ${capital}
      Location: ${loc}
      Business Idea: ${desc}
      Language: Detect if user used Hausa or English and respond in that same language.
      Provide Recommendation, Profit Estimate, Risk Level, and Local Market Steps.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    // Wannan zai taimake ka ka ga ainihin matsalar a Console
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
