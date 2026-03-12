import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequest(context) {
    const { request, env } = context;
    const origin = request.headers.get("Origin") || "*";

    const corsHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
    };

    // MAGANIN CORS: Wannan bangaren ne yake sa preflight ya wuce
    if (request.method === "OPTIONS") {
        return new Response(null, { 
            status: 204, // No Content amma OK status
            headers: corsHeaders 
        });
    }

    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: corsHeaders
        });
    }

    try {
        const { capital, loc, desc, password } = await request.json();

        if (password !== "@haruna66") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: corsHeaders
            });
        }

        // Tabbatar ka saka wannan a Cloudflare Dashboard
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as a Fintech AI Consultant. Capital: ${capital}, Location: ${loc}, Idea: ${desc}. Ba ni shawara a harshen da na yi magana.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        return new Response(JSON.stringify({ text: response.text() }), {
            status: 200,
            headers: { 
                ...corsHeaders,
                "Content-Type": "application/json" 
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
