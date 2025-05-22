const express = require('express');
const router = express.Router();
const fetchRoadData = require('../utils/fetchRoadData');
const buildGraph = require('../utils/buildGraph');
const findMultipleRoutes = require('../utils/findMultipleRoutes');
const { checkCachedRoutes, cacheRoutes } = require('../utils/cacheRoutes');
const haversineDistance = require('../utils/haversineDistance');

router.post('/', async (req, res) => {
  const { startLat, startLon, endLat, endLon, alternatives } = req.body;

  console.log('Requête /api/route - Body:', req.body);

  // Validation stricte des paramètres
  if (startLat === undefined || startLon === undefined || endLat === undefined || endLon === undefined) {
    console.error('Paramètres manquants dans la requête:', { startLat, startLon, endLat, endLon });
    return res.status(400).json({ success: false, message: 'Les coordonnées de départ et d\'arrivée sont requises' });
  }

  if (typeof startLat !== 'number' || isNaN(startLat)) {
    console.error('startLat invalide:', startLat);
    return res.status(400).json({ success: false, message: 'startLat doit être un nombre valide' });
  }
  if (typeof startLon !== 'number' || isNaN(startLon)) {
    console.error('startLon invalide:', startLon);
    return res.status(400).json({ success: false, message: 'startLon doit être un nombre valide' });
  }
  if (typeof endLat !== 'number' || isNaN(endLat)) {
    console.error('endLat invalide:', endLat);
    return res.status(400).json({ success: false, message: 'endLat doit être un nombre valide' });
  }
  if (typeof endLon !== 'number' || isNaN(endLon)) {
    console.error('endLon invalide:', endLon);
    return res.status(400).json({ success: false, message: 'endLon doit être un nombre valide' });
  }

  try {
    // Vérifier si les itinéraires sont déjà en cache
    const cachedRoutes = await checkCachedRoutes(startLat, startLon, endLat, endLon);
    if (cachedRoutes.length > 0) {
      cachedRoutes.forEach((_, index) => {
        console.log(`Itinéraire ${index + 1} trouvé (depuis le cache)`);
      });
      return res.json({
        success: true,
        routes: cachedRoutes,
      });
    }

    // Récupérer les données routières
    const osmData = await fetchRoadData(startLat, startLon, endLat, endLon);

    // Construire le graphe
    const { nodes, edges, wayNames } = buildGraph(osmData, startLat, startLon, endLat, endLon);

    // Trouver les nœuds de départ et d'arrivée en privilégiant les nœuds avec des connexions
    let startNodeId = null;
    let endNodeId = null;
    let minStartDistance = Infinity;
    let minEndDistance = Infinity;

    for (const [nodeId, node] of nodes) {
      const startDistance = haversineDistance(startLat, startLon, node.lat, node.lon);
      const endDistance = haversineDistance(endLat, endLon, node.lat, node.lon);
      const neighbors = edges.get(nodeId) || new Map();

      if (startDistance < minStartDistance && neighbors.size > 0) { // Ensure the node has connections
        minStartDistance = startDistance;
        startNodeId = nodeId;
      }
      if (endDistance < minEndDistance && neighbors.size > 0) { // Ensure the node has connections
        minEndDistance = endDistance;
        endNodeId = nodeId;
      }
    }

    if (!startNodeId || !endNodeId) {
      console.error('Nœuds de départ ou d\'arrivée non trouvés ou isolés');
      return res.status(404).json({ success: false, message: 'Nœuds de départ ou d\'arrivée non trouvés ou isolés' });
    }

    console.log('Nœud de départ:', startNodeId, 'Distance:', minStartDistance, 'km');
    console.log('Nœud d\'arrivée:', endNodeId, 'Distance:', minEndDistance, 'km');

    // Trouver plusieurs itinéraires
    const routes = findMultipleRoutes(startNodeId, endNodeId, nodes, edges, wayNames, endLat, endLon, alternatives);

    if (routes.length === 0) {
      console.error('Aucun itinéraire trouvé');
      return res.status(404).json({ success: false, message: 'Aucun itinéraire trouvé' });
    }

    // Mettre les itinéraires en cache
    await cacheRoutes(startLat, startLon, endLat, endLon, routes);

    console.log('Itinéraires renvoyés:', routes.length);
    res.json({
      success: true,
      routes,
    });
  } catch (error) {
    console.error('Erreur lors du calcul de l\'itinéraire:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de l\'itinéraire: ' + error.message,
    });
  }
});

module.exports = router;
