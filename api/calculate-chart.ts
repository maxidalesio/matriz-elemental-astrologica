import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { date, time, location } = req.body;

  if (!date || !location) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // 1. Get Coordinates
    const geoPrompt = `Dame las coordenadas exactas (Latitud y Longitud) de "${location}". 
    Responde solo en formato JSON con este esquema exacto:
    {"latitude": number, "longitude": number}
    Ejemplo: {"latitude": -34.6037, "longitude": -58.3816}`;
    
    const geoResult = await model.generateContent(geoPrompt);
    const coords = JSON.parse(geoResult.response.text());

    // 2. Get UTC offset
    const timePrompt = `¿Cuál era el desplazamiento UTC (offset) en "${location}" el día ${date} a las ${time || "12:00"}? 
    Responde SOLO el número de horas como un número (ej: -3, 5.5, 0). Sin texto adicional.`;
    
    const timeResult = await model.generateContent(timePrompt);
    const offset = parseFloat(timeResult.response.text().trim()) || 0;

    // 3. Get extra astrological points via Gemini
    const extraPrompt = `Calcula los signos zodiacales para: Quirón, Nodo Norte, Nodo Sur para una persona nacida el ${date} a las ${time || "12:00"} (UTC${offset >= 0 ? '+' : ''}${offset}) en ${location}. 
    Responde solo en formato JSON array con este esquema exacto:
    [{"planeta": "Quirón", "signo": "Aries"}, {"planeta": "Nodo Norte", "signo": "Tauro"}, {"planeta": "Nodo Sur", "signo": "Escorpio"}]`;
    
    const extraResult = await model.generateContent(extraPrompt);
    
    let extraPoints = [];
    try {
      extraPoints = JSON.parse(extraResult.response.text());
    } catch (e) {
      console.warn("Could not get extra points:", e);
    }

    return res.json({
      coordinates: coords,
      utcOffset: offset,
      extraPoints
    });
  } catch (error) {
    console.error("Error in calculate-chart:", error);
    return res.status(500).json({ error: "Failed to calculate chart data" });
  }
}

