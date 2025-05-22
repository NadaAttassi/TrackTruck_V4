const Heap = require('heap');
const precomputeHeuristics = require('./precomputeHeuristics');

function aStar(startNodeId, endNodeId, nodes, edges) {
  // Check if start and end nodes have outgoing edges
  const startNeighbors = edges.get(startNodeId) || new Map();
  const endNeighbors = edges.get(endNodeId) || new Map();
  if (startNeighbors.size === 0) {
    console.error(`Nœud de départ ${startNodeId} est isolé - aucun voisin`);
    return [];
  }
  if (endNeighbors.size === 0) {
    console.error(`Nœud d'arrivée ${endNodeId} est isolé - aucun voisin`);
    return [];
  }

  const heap = new Heap((a, b) => a.f - b.f);
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  const heuristics = precomputeHeuristics(endNodeId, nodes);

  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, heuristics.get(startNodeId));

  heap.push({ f: fScore.get(startNodeId), node: startNodeId });

  while (!heap.empty()) {
    const current = heap.pop().node;

    if (current === endNodeId) {
      const path = [];
      let temp = current;
      while (cameFrom.has(temp)) {
        path.unshift(temp);
        temp = cameFrom.get(temp);
      }
      path.unshift(startNodeId);
      return path;
    }

    const neighbors = edges.get(current) || new Map();
    for (const [nextNode, edgeData] of neighbors) {
      const tentativeGScore = gScore.get(current) + edgeData.distance;

      if (!gScore.has(nextNode) || tentativeGScore < gScore.get(nextNode)) {
        cameFrom.set(nextNode, current);
        gScore.set(nextNode, tentativeGScore);
        fScore.set(nextNode, tentativeGScore + heuristics.get(nextNode));
        heap.push({ f: fScore.get(nextNode), node: nextNode });
      }
    }
  }

  console.log(`Aucun chemin trouvé entre ${startNodeId} et ${endNodeId}`);
  return [];
}

module.exports = aStar;
