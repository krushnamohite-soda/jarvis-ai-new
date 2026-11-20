export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "https://krushnamohite4443-hue.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return Response.json(
        { status: "online", assistant: "JARVIS AI" },
        { headers: cors }
      );
    }

    if (url.pathname === "/chat" && request.method === "POST") {
      if (!env.GEMINI_API_KEY) {
        return Response.json(
          { error: "AI key is not configured" },
          { status: 503, headers: cors }
        );
      }

      try {
        const body = await request.json();

        if (typeof body.message !== "string" ||
            body.message.length === 0 ||
            body.message.length > 4000) {
          return Response.json(
            { error: "Invalid message" },
            { status: 400, headers: cors }
          );
        }

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{
                  text: "तू JARVIS आहेस. वापरकर्त्याला बॉस म्हणून संबोध. मराठीत आत्मविश्वासाने आणि मदतशीलपणे उत्तर दे."
                }]
              },
              contents: [{
                role: "user",
                parts: [{ text: body.message }]
              }]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return Response.json(
            { error: "AI service error" },
            { status: 502, headers: cors }
          );
        }

        const answer =
          data.candidates?.[0]?.content?.parts?.[0]?.text || "उत्तर उपलब्ध नाही.";

        return Response.json({ reply: answer }, { headers: cors });

      } catch {
        return Response.json(
          { error: "Request failed" },
          { status: 400, headers: cors }
        );
      }
    }

    return Response.json(
      { error: "Not found" },
      { status: 404, headers: cors }
    );
  }
};