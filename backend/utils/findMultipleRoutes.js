const aStar = require('./aStar');
const generateInstructions = require('./generateInstructions');
const haversineDistance = require('./haversineDistance');

function findMultipleRoutes(startNodeId, endNodeId, nodes, edges, wayNames, endLat, endLon, alternatives) {
  const routes = [];
  const k = Math.min(alternatives || 10, 10); // Limiter à 10 itinéraires maximum
  const usedEdges = new Set(); // Pour suivre les arêtes utilisées

  for (let i = 0; i < k; i++) {
    const path = aStar(startNodeId, endNodeId, nodes, edges);
    if (path.length === 0) {
      console.log(`Itinéraire ${i + 1} non trouvé`);
      break;
    }

    // Calculer la géométrie et la distance
    let geometry = path.map(nodeId => ({
      lat: nodes.get(nodeId).lat,
      lon: nodes.get(nodeId).lon,
    }));

    const lastNode = geometry[geometry.length - 1];
    const distanceToEnd = haversineDistance(lastNode.lat, lastNode.lon, endLat, endLon);
    if (distanceToEnd > 0.001) {
      geometry.push({ lat: endLat, lon: endLon });
    }

    let distance = 0;
    for (let j = 0; j < path.length - 1; j++) {
      const edgeData = edges.get(path[j]).get(path[j + 1]);
      distance += edgeData.distance;
    }
    distance += distanceToEnd;

    const averageSpeed = 40;
    const durationInHours = distance / averageSpeed;
    const durationInMinutes = durationInHours * 60;

    routes.push({
      geometry: geometry.map(coord => [coord.lat, coord.lon]),
      instructions: generateInstructions(path, nodes, wayNames),
      distance: distance,
      duration: durationInMinutes,
      riskLevel: Math.random(), // Simuler un niveau de risque
    });

    console.log(`Itinéraire ${i + 1} trouvé - Distance: ${distance.toFixed(2)} km - Durée: ${durationInMinutes.toFixed(2)} minutes`);

    // Augmenter les poids des arêtes utilisées pour forcer A* à trouver un autre chemin
    for (let j = 0; j < path.length - 1; j++) {
      const fromNode = path[j];
      const toNode = path[j + 1];
      const edgeKey = `${fromNode}-${toNode}`;
      if (!usedEdges.has(edgeKey)) {
        usedEdges.add(edgeKey);
        usedEdges.add(`${toNode}-${fromNode}`); // Bidirectionnel
        const edgeData = edges.get(fromNode).get(toNode);
        edgeData.distance = edgeData.originalDistance * 10; // Augmenter le poids
        edges.get(toNode).set(fromNode, edgeData); // Mettre à jour dans les deux sens
      }
    }
  }

  // Réinitialiser les poids des arêtes pour les futures requêtes
  for (const [fromNode, neighbors] of edges) {
    for (const [toNode, edgeData] of neighbors) {
      edgeData.distance = edgeData.originalDistance;
      edges.get(fromNode).set(toNode, edgeData);
      edges.get(toNode).set(fromNode, edgeData);
    }
  }

  return routes;
}

module.exports = findMultipleRoutes;
