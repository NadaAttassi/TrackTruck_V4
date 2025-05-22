const express = require('express');
const router = express.Router();
const isPointInPolygon = require('./utils/isPointInPolygon');

// Fonction pour calculer la distance Haversine

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Rayon de la Terre en mètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance en mètres
}

// Route pour analyser les points à risque
router.post('/analyze-risk', async (req, res) => {
  try {
    const { routes, zones } = req.body;

    if (!routes || !Array.isArray(routes) || !zones || !Array.isArray(zones)) {
      return res.status(400).json({
        success: false,
        message: 'Les itinéraires et les zones doivent être des tableaux valides',
      });
    }

    console.log('Analyse des points à risque pour', routes.length, 'itinéraires');
    console.log('Nombre de zones:', zones.length);
    zones.forEach((zone, index) => {
      console.log(
        `Zone ${index + 1}: Risque=${zone.risk}, Points=${zone.geometry.length}, Coords=${JSON.stringify(
          zone.geometry[0]
        )}`
      );
      const normalizedRisk = zone.risk?.toLowerCase() || 'inconnu';
      console.log(`Zone ${index + 1}: Risque normalisé=${normalizedRisk}`);
      const lats = zone.geometry.map(p => p.lat);
      const lons = zone.geometry.map(p => p.lon);
      console.log(
        `Zone ${index + 1}: Lat range=[${Math.min(...lats)}, ${Math.max(...lats)}], Lon range=[${Math.min(...lons)}, ${Math.max(...lons)}]`
      );
    });

    const proximityThreshold = 500; // 500 mètres

    const riskAnalysis = routes.map((route, index) => {
      const geometry = route.geometry || [];
      if (!Array.isArray(geometry)) {
        console.warn(`Itinéraire ${index + 1} - Géométrie invalide`);
        return {
          routeIndex: index,
          riskCounts: {
            élevé: 0,
            moyen: 0,
            faible: 0,
            inconnu: 0,
          },
          totalPoints: 0,
        };
      }

      let riskCounts = {
        élevé: 0,
        moyen: 0,
        faible: 0,
        inconnu: 0,
      };
      let totalPoints = geometry.length;

      geometry.forEach((point, pointIndex) => {
        const pointObj = {
          lat: point[0],
          lon: point[1],
        };

        let pointRisk = null;

        for (const zone of zones) {
          if (isPointInPolygon(pointObj, zone.geometry)) {
            pointRisk = zone.risk?.toLowerCase() || 'inconnu';
            console.log(
              `Itinéraire ${index + 1}, Point ${pointIndex + 1} (${pointObj.lat}, ${
                pointObj.lon
              }) est DANS la zone ${zone.zoneId} avec risque=${pointRisk}`
            );
            break;
          }
        }

        if (!pointRisk) {
          let minDist = Infinity;
          let nearestRisk = null;
          let nearestZoneId = null;

          for (const zone of zones) {
            for (const zonePoint of zone.geometry) {
              const dist = haversineDistance(
                pointObj.lat,
                pointObj.lon,
                zonePoint.lat,
                zonePoint.lon
              );
              if (dist < minDist) {
                minDist = dist;
                nearestRisk = zone.risk?.toLowerCase() || 'inconnu';
                nearestZoneId = zone.zoneId;
              }
            }
          }

          if (minDist <= proximityThreshold) {
            pointRisk = nearestRisk;
            console.log(
              `Itinéraire ${index + 1}, Point ${pointIndex + 1} (${pointObj.lat}, ${
                pointObj.lon
              }) est PROCHE (distance=${minDist.toFixed(2)}m) de la zone ${nearestZoneId} avec risque=${pointRisk}`
            );
          } else {
            console.log(
              `Itinéraire ${index + 1}, Point ${pointIndex + 1} (${pointObj.lat}, ${
                pointObj.lon
              }) est TROP LOIN (distance=${minDist.toFixed(2)}m) - marqué comme inconnu`
            );
          }
        }

        if (pointRisk) {
          riskCounts[pointRisk] = (riskCounts[pointRisk] || 0) + 1;
        } else {
          riskCounts['inconnu'] = (riskCounts['inconnu'] || 0) + 1;
        }
      });

      console.log(`Itinéraire ${index + 1} - Points analysés:`, riskCounts);

      return {
        routeIndex: index,
        riskCounts,
        totalPoints,
      };
    });

    res.json({
      success: true,
      analysis: riskAnalysis,
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse des points à risque:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse des points à risque',
      details: error.message,
    });
  }
});

module.exports = router;
