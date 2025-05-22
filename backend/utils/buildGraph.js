const haversineDistance = require('./haversineDistance');

function buildGraph(osmData, startLat, startLon, endLat, endLon) {
  const nodes = new Map();
  const edges = new Map();
  const wayNames = new Map();

  // Étape 1 : Ajouter tous les nœuds
  osmData.elements.forEach(element => {
    if (element.type === 'node') {
      nodes.set(element.id, { lat: element.lat, lon: element.lon });
    }
  });

  // Étape 2 : Construire le graphe en ajoutant toutes les arêtes
  let edgeCount = 0;
  osmData.elements.forEach(element => {
    if (element.type === 'way' && element.nodes) {
      const roadName = element.tags?.name || element.tags?.highway || 'Route sans nom';
      for (let i = 0; i < element.nodes.length - 1; i++) {
        const fromNode = element.nodes[i];
        const toNode = element.nodes[i + 1];
        if (nodes.has(fromNode) && nodes.has(toNode)) {
          const from = nodes.get(fromNode);
          const to = nodes.get(toNode);
          const distance = haversineDistance(from.lat, from.lon, to.lat, to.lon);

          if (!edges.has(fromNode)) edges.set(fromNode, new Map());
          if (!edges.has(toNode)) edges.set(toNode, new Map());

          edges.get(fromNode).set(toNode, { distance, originalDistance: distance, roadName });
          edges.get(toNode).set(fromNode, { distance, originalDistance: distance, roadName }); // Assurer la bidirectionnalité
          edgeCount++;

          wayNames.set(`${fromNode}-${toNode}`, roadName);
          wayNames.set(`${toNode}-${fromNode}`, roadName);
        }
      }
    }
  });

  console.log('Graphe construit - Nœuds:', nodes.size, 'Arêtes:', edgeCount);
  // Log connectivity of start and end nodes
  const startNodeId = [...nodes.keys()].find(nodeId => {
    const node = nodes.get(nodeId);
    return haversineDistance(startLat, startLon, node.lat, node.lon) < 0.5; // Within 0.5 km
  });
  const endNodeId = [...nodes.keys()].find(nodeId => {
    const node = nodes.get(nodeId);
    return haversineDistance(endLat, endLon, node.lat, node.lon) < 2; // Within 2 km
  });
  if (startNodeId) {
    const startNeighbors = edges.get(startNodeId) || new Map();
    console.log(`Nœud de départ ${startNodeId} - Voisins: ${startNeighbors.size}`);
  } else {
    console.log('Aucun nœud de départ trouvé à moins de 0.5 km');
  }
  if (endNodeId) {
    const endNeighbors = edges.get(endNodeId) || new Map();
    console.log(`Nœud d'arrivée ${endNodeId} - Voisins: ${endNeighbors.size}`);
  } else {
    console.log('Aucun nœud d\'arrivée trouvé à moins de 2 km');
  }

  return { nodes, edges, wayNames };
}

module.exports = buildGraph;
