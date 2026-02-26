import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;

  if (!query || query.length < 3) {
    return res.json([]);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    
    const prompt = `Proporciona una lista de hasta 5 ciudades populares que coincidan con el texto: "${query}". 
    Devuelve solo un array JSON de strings con el formato "Ciudad, País".
    Ejemplo: ["Buenos Aires, Argentina", "Barcelona, España"]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const suggestions = JSON.parse(text);
    return res.json(suggestions);
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    return res.status(500).json({ error: "Failed to fetch suggestions" });
  }
}

