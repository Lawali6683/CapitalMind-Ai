import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequest(context) {
    const { request, env } = context;
    const origin = request.headers.get("Origin") || "*";

    // Saitin CORS da zai amince da kowane kiran
    const corsHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // MAGANIN MATSALAR: Karbar kiran farko (OPTIONS) ba tare da duba komai ba
    if (request.method === "OPTIONS") {
        return new Response(null, { 
            status: 204, 
            headers: corsHeaders 
        });
    }

    try {
        const body = await request.json();
        const { capital, loc, desc, password } = body;

        // Duba Password a ainihin POST request din
        if (password !== "@haruna66") {
            return new Response(JSON.stringify({ error: "Unauthorized access" }), {
                status: 401,
                headers: corsHeaders
            });
        }

        // Tabbatar API Key dinka yana Dashboard din Cloudflare
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as a Fintech AI Consultant. 
        Capital: ${capital}, Location: ${loc}, Idea: ${desc}. 
        Respond in the language used by the user (Hausa or English). 
        Provide Recommendation, Profit Estimate, Risk Level, and Local Market Steps.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        return new Response(JSON.stringify({ text: response.text() }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
