import { BirthData, PlanetaryPosition } from "../types";
import * as Astronomy from "astronomy-engine";

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

export async function getLocationSuggestions(query: string): Promise<string[]> {
  if (query.length < 3) return [];

  try {
    const response = await fetch("/api/location-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error("Error fetching location suggestions:", e);
    return [];
  }
}

export async function getPlanetaryPositionsFromBirthData(data: BirthData): Promise<AstrologyResponse> {
  // Get coordinates and extra data from backend (uses Gemini API)
  const response = await fetch("/api/calculate-chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: data.date,
      time: data.time,
      location: data.location,
    }),
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener los datos de ubicación.");
  }

  const { coordinates, utcOffset, extraPoints } = await response.json();

  // Calculate planetary positions in the frontend using astronomy-engine
  const localDate = new Date(`${data.date}T${data.time || "12:00"}:00Z`);
  const utcDate = new Date(localDate.getTime() - (utcOffset * 60 * 60 * 1000));

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
      const vec = Astronomy.GeoVector(b.body, utcDate, true);
      const ecl = Astronomy.Ecliptic(vec);
      lon = ecl.elon;
    }
    positions.push({ planeta: b.name, signo: getSign(lon) });
  }

  // Calculate Ascendant
  const siderealTime = Astronomy.SiderealTime(utcDate);
  const lst = (siderealTime + coordinates.longitude / 15.0) % 24;
  const lstRad = (lst * 15.0 * Math.PI) / 180.0;
  
  const tilt = Astronomy.e_tilt(Astronomy.MakeTime(utcDate));
  const eps = (tilt.tobl * Math.PI) / 180.0;
  const phi = (coordinates.latitude * Math.PI) / 180.0;
  
  const ascRad = Math.atan2(Math.cos(lstRad), -Math.sin(lstRad) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps));
  const ascDeg = (ascRad * 180.0) / Math.PI;
  positions.push({ planeta: "Ascendente", signo: getSign(ascDeg) });

  // Add extra points from Gemini
  if (extraPoints && extraPoints.length > 0) {
    positions.push(...extraPoints.map((p: any) => ({ ...p, signo: normalizeSign(p.signo) })));
  }

  return {
    positions: positions.map(p => ({ ...p, signo: normalizeSign(p.signo) })),
    coordinates,
    utcOffset
  };
}
