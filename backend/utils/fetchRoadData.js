const axios = require('axios');

async function fetchRoadData(startLat, startLon, endLat, endLon) {
  const padding = 0.02;
  const minLat = Math.min(startLat, endLat) - padding;
  const maxLat = Math.max(startLat, endLat) + padding;
  const minLon = Math.min(startLon, endLon) - padding;
  const maxLon = Math.max(startLon, endLon) + padding;

  const highwayTypes = 'motorway|trunk|primary|secondary|tertiary';
  const overpassQuery = `
    [out:json];
    (
      way["highway"~"(${highwayTypes})"]
        ["access"!~"no"]
        (${minLat},${minLon},${maxLat},${maxLon});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    console.log('Requête Overpass:', overpassQuery);
    const response = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, { timeout: 30000 });
    console.log('Données Overpass reçues:', response.data.elements.length, 'éléments');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des données Overpass:', error.message);
    throw new Error('Erreur lors de la récupération des données routières');
  }
}

module.exports = fetchRoadData;
