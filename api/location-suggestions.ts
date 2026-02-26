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
    // Use OpenStreetMap Nominatim API (free, no API key required)
    const url = `https://nominatim.openstreetmap.org/search?` + 
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=5&` +
      `featuretype=city`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MatrizElementalAstrologica/1.0'
      }
    });

    if (!response.ok) {
      return res.json([]);
    }

    const data = await response.json();
    
    // Format results as "City, Country"
    const suggestions = data.map((place: any) => {
      const city = place.address?.city || 
                   place.address?.town || 
                   place.address?.village || 
                   place.name;
      const country = place.address?.country || '';
      return country ? `${city}, ${country}` : city;
    }).filter((s: string) => s); // Remove empty strings

    return res.json(suggestions.slice(0, 5));
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    return res.json([]); // Return empty array on error
  }
}

