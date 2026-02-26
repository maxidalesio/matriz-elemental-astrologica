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

    // Get accurate timezone offset for the specific date/time
    // Using WorldTimeAPI.org (free, no API key, considers historical timezones)
    const dateStr = `${date}T${time || "12:00"}:00`;
    
    try {
      // First try to get timezone name from coordinates using timezone.db
      const tzUrl = `https://api.timezonedb.com/v2.1/get-time-zone?` +
        `key=demo&` + // Demo key for testing, limited but works
        `format=json&` +
        `by=position&` +
        `lat=${coords.latitude}&` +
        `lng=${coords.longitude}&` +
        `time=${Math.floor(new Date(dateStr).getTime() / 1000)}`;

      const tzResponse = await fetch(tzUrl);
      if (tzResponse.ok) {
        const tzData = await tzResponse.json();
        if (tzData.status === "OK") {
          const offset = tzData.gmtOffset / 3600; // Convert seconds to hours
          
          return res.json({
            coordinates: coords,
            utcOffset: offset
          });
        }
      }
    } catch (tzError) {
      console.warn("Primary timezone API failed:", tzError);
    }

    // Fallback: Manual timezone database for major cities
    const knownTimezones: Record<string, number> = {
      "buenos aires": -3,
      "argentina": -3,
      "new york": -5,
      "los angeles": -8,
      "london": 0,
      "paris": 1,
      "tokyo": 9,
      "sydney": 10,
      "madrid": 1,
      "barcelona": 1,
      "mexico": -6,
      "bogota": -5,
      "lima": -5,
      "santiago": -3,
      "montevideo": -3,
      "rio de janeiro": -3,
      "sao paulo": -3,
    };

    const locationLower = location.toLowerCase();
    for (const [city, offset] of Object.entries(knownTimezones)) {
      if (locationLower.includes(city)) {
        return res.json({
          coordinates: coords,
          utcOffset: offset
        });
      }
    }

    // Last resort: rough estimation
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

