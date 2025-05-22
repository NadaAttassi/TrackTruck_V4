const express = require('express');
const router = express.Router();
const pool = require('../db');
const fetchFromGeocoder = require('../utils/fetchFromGeocoder');

router.post('/', async (req, res) => {
  let { query } = req.body;
  if (!query) {
    console.log('Requête /api/suggestions: query vide');
    return res.json([]);
  }

  query = query.replace(/^"|"$/g, '');

  try {
    console.log('Requête /api/suggestions:', query);

    // Step 1: Fetch suggestions from the database
    const sqlQuery = `
      SELECT name, type, city, lat, lon 
      FROM places 
      WHERE name ILIKE $1 
        OR type ILIKE $1 
        OR city ILIKE $1 
      LIMIT 10
    `;
    const values = [`%${query}%`];
    const dbResult = await pool.query(sqlQuery, values);

    let suggestions = dbResult.rows.map(row => ({
      name: row.name,
      type: row.type,
      city: row.city,
      lat: parseFloat(row.lat),
      lon: parseFloat(row.lon),
      source: 'database' // Add source for debugging
    }));

    // Step 2: If no results from the database, query Photon and cache the results
    if (suggestions.length === 0) {
      console.log('Aucune suggestion dans la base de données, recherche via Photon:', query);
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=fr&bbox=-17.0,21.0,-1.0,36.0`;
      const photonResponse = await fetchFromGeocoder(photonUrl);
      const photonFeatures = photonResponse.data.features;

      const photonSuggestions = photonFeatures.map(feature => {
        const city = feature.properties.city || 'Unknown'; // Fallback if city is missing
        return {
          name: feature.properties.name || 'Unknown Place',
          type: feature.properties.osm_value || feature.properties.type || 'unknown',
          city: city,
          lat: feature.geometry.coordinates[1], // Latitude (Photon: [lon, lat])
          lon: feature.geometry.coordinates[0], // Longitude
          source: 'photon' // Add source for debugging
        };
      });

      // Cache Photon results in the database
      for (const suggestion of photonSuggestions) {
        try {
          await pool.query(
            'INSERT INTO places (name, lat, lon, type, city, osm_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (name, lat, lon) DO NOTHING',
            [suggestion.name, suggestion.lat, suggestion.lon, suggestion.type, suggestion.city, suggestion.osm_id]
          );
        } catch (error) {
          console.error(`Erreur lors de l'insertion de ${suggestion.name} dans la base de données:`, error.message);
        }
      }

      suggestions = photonSuggestions;
    }

    // Step 3: Remove the source field and return the suggestions
    const finalSuggestions = suggestions.map(({ source, ...rest }) => rest);

    console.log('Suggestions renvoyées:', finalSuggestions);
    res.json(finalSuggestions);
  } catch (error) {
    console.error('Erreur /api/suggestions:', error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des suggestions' });
  }
});

module.exports = router;
