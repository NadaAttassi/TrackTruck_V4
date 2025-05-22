const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/forbidden-zones', async (req, res) => {
  try {
    console.log('Requête reçue pour /api/forbidden-zones');

    const apiUrl = 'https://zoneaoi-r4id04xln-imane1.vercel.app/zones';
    const response = await axios.get(apiUrl);
    const apiZones = response.data;

    const zones = apiZones.map(zone => {
      if (!zone?.geometry || !Array.isArray(zone.geometry)) {
        console.warn(`Zone ${zone.zoneId || 'sans ID'} ignorée - géométrie invalide`);
        return null;
      }

      const coordinates = zone.geometry.map(coord => ({
        lat: coord.lat,
        lon: coord.lon
      }));

      if (coordinates.length < 3) {
        console.warn(`Zone ${zone.zoneId || 'sans ID'} ignorée - pas assez de points valides`);
        return null;
      }

      return {
        zoneId: zone.zoneId || 'unknown',
        geometry: coordinates,
        risk: zone.risk?.toLowerCase() || 'unknown',
        tags: zone.tags || {}
      };
    }).filter(Boolean);

    res.json({
      success: true,
      zones: zones
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des zones:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des zones',
      details: error.message
    });
  }
});

module.exports = router;
