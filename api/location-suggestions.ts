import { GoogleGenAI, Type } from "@google/genai";
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
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    const prompt = `Proporciona una lista de hasta 5 ciudades populares que coincidan con el texto: "${query}". 
    Devuelve solo un array de strings con el formato "Ciudad, País".`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const suggestions = JSON.parse(response.text.trim());
    return res.json(suggestions);
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    return res.status(500).json({ error: "Failed to fetch suggestions" });
  }
}

