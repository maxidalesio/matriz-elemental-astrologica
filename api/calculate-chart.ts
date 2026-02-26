import type { VercelRequest, VercelResponse } from "@vercel/node";

// Simple timezone estimation based on longitude (rough approximation)
function estimateTimezoneOffset(longitude: number): number {
  // Basic calculation: 15 degrees = 1 hour
  const offset = Math.round(longitude / 15);
  return offset;
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
    // Get Coordinates using OpenStreetMap Nominatim (free, no API key)
    const url = `https://nominatim.openstreetmap.org/search?` + 
      `q=${encodeURIComponent(location)}&` +
      `format=json&` +
      `limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MatrizElementalAstrologica/1.0'
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to geocode location" });
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    const coords = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };

    // Estimate timezone offset based on longitude
    const offset = estimateTimezoneOffset(coords.longitude);

    return res.json({
      coordinates: coords,
      utcOffset: offset
    });
  } catch (error) {
    console.error("Error in calculate-chart:", error);
    return res.status(500).json({ error: "Failed to calculate chart data" });
  }
}

