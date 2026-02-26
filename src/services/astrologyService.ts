import { BirthData, PlanetaryPosition } from "../types";

export interface AstrologyResponse {
  positions: PlanetaryPosition[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  utcOffset: number;
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
    throw new Error("No se pudo calcular la carta natal.");
  }

  return await response.json();
}
