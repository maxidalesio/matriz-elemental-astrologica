import { GoogleGenAI, Type } from "@google/genai";
import * as Astronomy from "astronomy-engine";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SIGNS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", 
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"
];

function getSign(longitude: number): string {
  let normalized = longitude % 360;
  if (normalized < 0) normalized += 360;
  const index = Math.floor(normalized / 30);
  return SIGNS[index];
}

function normalizeSign(sign: string): string {
  const map: Record<string, string> = {
    "aries": "Aries",
    "tauro": "Tauro",
    "geminis": "Géminis",
    "géminis": "Géminis",
    "cancer": "Cáncer",
    "cáncer": "Cáncer",
    "leo": "Leo",
    "virgo": "Virgo",
    "libra": "Libra",
    "escorpio": "Escorpio",
    "sagitario": "Sagitario",
    "capricornio": "Capricornio",
    "acuario": "Acuario",
    "piscis": "Piscis"
  };
  return map[sign.toLowerCase()] || sign;
}

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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
      contents: timePrompt
    });
    const offset = parseFloat(timeResponse.text.trim()) || 0;

    // 3. Calculate planetary positions
    const localDate = new Date(`${date}T${time || "12:00"}:00Z`);
    const utcDate = new Date(localDate.getTime() - (offset * 60 * 60 * 1000));
    const observer = new Astronomy.Observer(coords.latitude, coords.longitude, 0);

    const bodies = [
      { name: "Sol", body: Astronomy.Body.Sun },
      { name: "Luna", body: Astronomy.Body.Moon },
      { name: "Mercurio", body: Astronomy.Body.Mercury },
      { name: "Venus", body: Astronomy.Body.Venus },
      { name: "Marte", body: Astronomy.Body.Mars },
      { name: "Júpiter", body: Astronomy.Body.Jupiter },
      { name: "Saturno", body: Astronomy.Body.Saturn },
      { name: "Urano", body: Astronomy.Body.Uranus },
      { name: "Neptuno", body: Astronomy.Body.Neptune },
      { name: "Plutón", body: Astronomy.Body.Pluto },
    ];

    const positions: Array<{ planeta: string; signo: string }> = [];

    for (const b of bodies) {
      let lon = 0;
      if (b.body === Astronomy.Body.Moon) {
        const e = Astronomy.Libration(utcDate);
        lon = e.mlon;
      } else {
        const vec = Astronomy.GeoVector(b.body, utcDate, true);
        const ecl = Astronomy.Ecliptic(vec);
        lon = ecl.elon;
      }
      positions.push({ planeta: b.name, signo: getSign(lon) });
    }

    // Calculate Ascendant
    const siderealTime = Astronomy.SiderealTime(utcDate);
    const lst = (siderealTime + coords.longitude / 15.0) % 24;
    const lstRad = (lst * 15.0 * Math.PI) / 180.0;
    
    const tilt = Astronomy.e_tilt(Astronomy.MakeTime(utcDate));
    const eps = (tilt.tobl * Math.PI) / 180.0;
    const phi = (coords.latitude * Math.PI) / 180.0;
    
    const ascRad = Math.atan2(Math.cos(lstRad), -Math.sin(lstRad) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps));
    const ascDeg = (ascRad * 180.0) / Math.PI;
    positions.push({ planeta: "Ascendente", signo: getSign(ascDeg) });

    // Get extra points via Gemini
    const extraPrompt = `Calcula los signos para: Quirón, Nodo Norte, Nodo Sur para una persona nacida el ${date} a las ${time || "12:00"} (UTC${offset >= 0 ? '+' : ''}${offset}) en ${location}. Responde solo JSON.`;
    const extraResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    try {
      const extras = JSON.parse(extraResponse.text.trim());
      positions.push(...extras);
    } catch (e) {
      console.warn("Could not get extra points:", e);
    }

    return res.json({
      positions: positions.map(p => ({ ...p, signo: normalizeSign(p.signo) })),
      coordinates: coords,
      utcOffset: offset
    });
  } catch (error) {
    console.error("Error calculating chart:", error);
    return res.status(500).json({ error: "Failed to calculate chart" });
  }
}

