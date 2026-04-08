export async function POST(req) {
  try {
    const { prompt, contextObj, history } = await req.json();

    const dataContext = JSON.stringify(contextObj, null, 2);
    
    const systemInstruction = `You are BikeCare AI, an expert, 100% accurate motorcycle and scooter mechanic. 
You are embedded inside a bike tracking application. 
The user's current data is as follows:
${dataContext}

Follow these rules:
1. Always be helpful, concise, and highly conversational.
2. If the user asks for analysis of their data, read the context object and summarize it naturally. 
3. **DO NOT** output Markdown tables, LaTeX math equations (like \\frac or $$), or raw data dumps.
4. Instead, use clean bullet points, short paragraphs, bold text for emphasis, and plenty of line breaks to make your response easy to read on a mobile device.
5. If you do not have enough data to precisely answer an efficiency question, explain what data is missing from the app (e.g., fuel litrage) gracefully.`;

    const messages = [
      { role: "system", content: systemInstruction },
      ...(history || []).map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.text })),
      { role: "user", content: prompt }
    ];

    const modelResponse = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: messages,
        temperature: 0.7
      })
    });

    if (!modelResponse.ok) {
       const errBody = await modelResponse.text();
       throw new Error(`AI Provider Error: ${modelResponse.status} ${errBody.substring(0,100)}`);
    }

    const data = await modelResponse.json();
    const responseText = data.choices[0].message.content;

    return Response.json({ response: responseText });
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
