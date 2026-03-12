import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequest(context) {

  const { request, env } = context;

  const allowedOrigins = [
    "https://capitalmindai.pages.dev",
    "http://localhost:8080"
  ];

  const origin = request.headers.get("Origin");

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
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

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return new Response(
      JSON.stringify({ text: response.text() }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {

    return new Response(
      JSON.stringify({ error: "AI Service Error" }),
      { status: 500 }
    );

  }

}
