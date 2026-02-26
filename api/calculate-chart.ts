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
    // Get Coordinates using OpenStreetMap Nominatim (free, no API key)
    const geoUrl = `https://nominatim.openstreetmap.org/search?` + 
      `q=${encodeURIComponent(location)}&` +
      `format=json&` +
      `limit=1`;

    const geoResponse = await fetch(geoUrl, {
      headers: {
        'User-Agent': 'MatrizElementalAstrologica/1.0'
      }
    });

    if (!geoResponse.ok) {
      return res.status(500).json({ error: "Failed to geocode location" });
    }

    const geoData = await geoResponse.json();
    
    if (!geoData || geoData.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    const coords = {
      latitude: parseFloat(geoData[0].lat),
      longitude: parseFloat(geoData[0].lon)
    };

    // Get accurate timezone using TimeZoneDB API (free, 1 request per second limit)
    // Alternative: AbstractAPI timezone (free, no API key for basic use)
    const timestamp = Math.floor(new Date(`${date}T${time || "12:00"}:00`).getTime() / 1000);
    
    // Using AbstractAPI (free, no key required for timezone)
    const tzUrl = `https://timezone.abstractapi.com/v1/current_time/?` +
      `latitude=${coords.latitude}&` +
      `longitude=${coords.longitude}`;

    try {
      const tzResponse = await fetch(tzUrl);
      if (tzResponse.ok) {
        const tzData = await tzResponse.json();
        const offset = tzData.gmt_offset || 0; // Offset in hours
        
        return res.json({
          coordinates: coords,
          utcOffset: offset
        });
      }
    } catch (tzError) {
      console.warn("Timezone API failed, using approximation:", tzError);
    }

    // Fallback: use rough estimation if timezone API fails
    const offset = Math.round(coords.longitude / 15);
    
    return res.json({
      coordinates: coords,
      utcOffset: offset
    });
  } catch (error) {
    console.error("Error in calculate-chart:", error);
    return res.status(500).json({ error: "Failed to calculate chart data" });
  }
}

