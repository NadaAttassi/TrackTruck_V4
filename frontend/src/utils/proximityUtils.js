import L from 'leaflet';

const checkProximity = (currentLocation, routeInstructions, isSpeaking, queueSpeech) => {
  if (!currentLocation || routeInstructions.length === 0) return;

  const nextInstruction = routeInstructions.find((instr) => {
    const distance = L.latLng(currentLocation).distanceTo(instr.point);
    return distance > 10;
  });

  if (nextInstruction) {
    const distance = L.latLng(currentLocation).distanceTo(nextInstruction.point);
    console.log(
      `checkProximity - Position actuelle: ${currentLocation}, Prochain point: [${nextInstruction.point.lat}, ${nextInstruction.point.lng}], Distance: ${distance.toFixed(2)}m, Instruction: "${nextInstruction.text}", isSpeaking: ${isSpeaking}`
    );

    if (distance < 50 && !isSpeaking) {
      queueSpeech(nextInstruction.text);
    }
  }
};

export { checkProximity };
