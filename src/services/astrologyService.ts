import { GoogleGenAI, Type } from "@google/genai";
import { BirthData, PlanetaryPosition } from "../types";
import * as Astronomy from "astronomy-engine";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AstrologyResponse {
  positions: PlanetaryPosition[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  utcOffset: number;
}

const SIGNS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", 
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"
];

function getSign(longitude: number): string {
  // Normalize longitude to 0-360
  let normalized = longitude % 360;
  if (normalized < 0) normalized += 360;
  const index = Math.floor(normalized / 30);
  return SIGNS[index];
}

export async function getLocationSuggestions(query: string): Promise<string[]> {
  if (query.length < 3) return [];

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

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    return [];
  }
}

export async function getPlanetaryPositionsFromBirthData(data: BirthData): Promise<AstrologyResponse> {
  // 1. Get Coordinates using Gemini (Geocoding)
  const geoPrompt = `Dame las coordenadas exactas (Latitud y Longitud) de "${data.location}". Responde solo en JSON.`;
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

  let coords: { latitude: number; longitude: number };
  try {
    coords = JSON.parse(geoResponse.text.trim());
  } catch (e) {
    console.error("Error parsing coordinates:", e);
    throw new Error("No se pudo obtener la ubicación geográfica.");
  }

  // 2. Calculate Planetary Positions using astronomy-engine
  const date = new Date(`${data.date}T${data.time || "12:00"}:00Z`); // Assume UTC for simplicity or handle timezone
  // Note: For better accuracy, we should handle the user's local timezone. 
  // But since we don't have the offset, we'll assume the input is already in UTC or we'd need another prompt to get the offset.
  // Let's ask Gemini for the UTC offset of that location at that date/time too.
  
  const timePrompt = `¿Cuál era el desplazamiento UTC (offset) en "${data.location}" el día ${data.date} a las ${data.time}? Responde solo el número de horas (ej: -3, 5.5, 0).`;
  const timeResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: timePrompt
  });
  const offset = parseFloat(timeResponse.text.trim()) || 0;
  
  // Adjust date to UTC
  const utcDate = new Date(date.getTime() - (offset * 60 * 60 * 1000));
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

  const positions: PlanetaryPosition[] = [];

  for (const b of bodies) {
    let lon = 0;
    if (b.body === Astronomy.Body.Moon) {
        const e = Astronomy.Libration(utcDate);
        lon = e.mlon;
    } else {
        // Geocentric position
        const vec = Astronomy.GeoVector(b.body, utcDate, true);
        const ecl = Astronomy.Ecliptic(vec);
        lon = ecl.elon;
    }
    positions.push({ planeta: b.name, signo: getSign(lon) });
  }

  // Calculate Ascendant
  // Formula: LST (Local Sidereal Time)
  const siderealTime = Astronomy.SiderealTime(utcDate); // Greenwich Sidereal Time in hours
  const lst = (siderealTime + coords.longitude / 15.0) % 24; // Local Sidereal Time in hours
  const lstRad = (lst * 15.0 * Math.PI) / 180.0;
  
  // Obliquity of the ecliptic
  const tilt = Astronomy.e_tilt(Astronomy.MakeTime(utcDate));
  const eps = (tilt.tobl * Math.PI) / 180.0;
  const phi = (coords.latitude * Math.PI) / 180.0;
  
  // Ascendant formula
  const ascRad = Math.atan2(Math.cos(lstRad), -Math.sin(lstRad) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps));
  const ascDeg = (ascRad * 180.0) / Math.PI;
  positions.push({ planeta: "Ascendente", signo: getSign(ascDeg) });

  // Add others via Gemini for now (Nodes, Chiron) as they are harder to calc with simple formulas
  const extraPrompt = `Calcula los signos para: Quirón, Nodo Norte, Nodo Sur para una persona nacida el ${data.date} a las ${data.time} (UTC${offset >= 0 ? '+' : ''}${offset}) en ${data.location}. Responde solo JSON.`;
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

  return {
    positions: positions.map(p => ({ ...p, signo: normalizeSign(p.signo) })),
    coordinates: coords,
    utcOffset: offset
  };
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
