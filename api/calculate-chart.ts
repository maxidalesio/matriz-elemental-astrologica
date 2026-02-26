import { GoogleGenAI, Type } from "@google/genai";
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
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    // 1. Get Coordinates
    const geoPrompt = `Dame las coordenadas exactas (Latitud y Longitud) de "${location}". Responde solo en JSON.`;
    const geoResponse = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: geoPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER }
          },
          required: ["latitude", "longitude"]
        }
      }
    });

    const coords = JSON.parse(geoResponse.text.trim());

    // 2. Get UTC offset
    const timePrompt = `¿Cuál era el desplazamiento UTC (offset) en "${location}" el día ${date} a las ${time || "12:00"}? Responde solo el número de horas (ej: -3, 5.5, 0).`;
    const timeResponse = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: timePrompt
    });
    const offset = parseFloat(timeResponse.text.trim()) || 0;

    // 3. Get extra astrological points via Gemini
    const extraPrompt = `Calcula los signos para: Quirón, Nodo Norte, Nodo Sur para una persona nacida el ${date} a las ${time || "12:00"} (UTC${offset >= 0 ? '+' : ''}${offset}) en ${location}. Responde solo JSON.`;
    const extraResponse = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: extraPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              planeta: { type: Type.STRING },
              signo: { type: Type.STRING }
            }
          }
        }
      }
    });

    let extraPoints = [];
    try {
      extraPoints = JSON.parse(extraResponse.text.trim());
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

