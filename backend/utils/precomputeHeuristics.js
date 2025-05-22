const haversineDistance = require('./haversineDistance');

function precomputeHeuristics(endNodeId, nodes) {
  const heuristics = new Map();
  const maxSpeed = 40 / 3.6; // 40 km/h en km/s
  for (const [nodeId, node] of nodes) {
    const distance = haversineDistance(
      node.lat,
      node.lon,
      nodes.get(endNodeId).lat,
      nodes.get(endNodeId).lon
    );
    heuristics.set(nodeId, distance / maxSpeed);
  }
  return heuristics;
}

module.exports = precomputeHeuristics;
