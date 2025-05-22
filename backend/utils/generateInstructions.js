const haversineDistance = require('./haversineDistance');

function generateInstructions(path, nodes, wayNames) {
  const instructions = [];
  let currentInstruction = null;

  for (let i = 0; i < path.length; i++) {
    if (i === 0) {
      instructions.push({ text: "Départ", point: [nodes.get(path[i]).lat, nodes.get(path[i]).lon], distance: 0 });
      continue;
    }
    if (i === path.length - 1) {
      instructions.push({ text: "Arrivée", point: [nodes.get(path[i]).lat, nodes.get(path[i]).lon], distance: 0 });
      continue;
    }

    if (i < path.length - 1) {
      const prevNode = nodes.get(path[i - 1]);
      const currentNode = nodes.get(path[i]);
      const nextNode = nodes.get(path[i + 1]);

      const vector1 = {
        x: currentNode.lon - prevNode.lon,
        y: currentNode.lat - prevNode.lat,
      };
      const vector2 = {
        x: nextNode.lon - currentNode.lon,
        y: nextNode.lat - currentNode.lat,
      };

      const crossProduct = vector1.x * vector2.y - vector1.y * vector2.x;
      const angleDeg = (Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x)) * (180 / Math.PI);

      let instructionText = "Continuer tout droit";
      if (Math.abs(angleDeg) > 30) {
        instructionText = crossProduct > 0 ? "Tourner à droite" : "Tourner à gauche";
      }

      const roadName = wayNames.get(`${path[i]}-${path[i + 1]}`) || 'Route sans nom';
      instructionText += ` sur ${roadName}`;

      const distance = haversineDistance(currentNode.lat, currentNode.lon, nextNode.lat, nextNode.lon) * 1000;

      if (currentInstruction && currentInstruction.text === instructionText) {
        currentInstruction.distance += distance;
        currentInstruction.point = [currentNode.lat, currentNode.lon];
      } else {
        if (currentInstruction) {
          instructions.push(currentInstruction);
        }
        currentInstruction = {
          text: instructionText,
          point: [currentNode.lat, currentNode.lon],
          distance,
        };
      }
    }
  }

  if (currentInstruction) {
    instructions.push(currentInstruction);
  }

  return instructions;
}

module.exports = generateInstructions;
