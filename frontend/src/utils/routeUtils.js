const groupInstructions = (instructions) => {
    if (!instructions || instructions.length === 0) return [];
  
    const grouped = [];
    let currentInstruction = { ...instructions[0], distance: instructions[0].distance || 0 };
  
    for (let i = 1; i < instructions.length; i++) {
      const prevText = currentInstruction.text.split(' sur ')[0];
      const currentText = instructions[i].text.split(' sur ')[0];
  
      if (prevText === currentText && instructions[i].text.includes('sur')) {
        currentInstruction.distance = (currentInstruction.distance || 0) + (instructions[i].distance || 0);
        currentInstruction.point = instructions[i].point;
      } else {
        grouped.push(currentInstruction);
        currentInstruction = { ...instructions[i], distance: instructions[i].distance || 0 };
      }
    }
  
    grouped.push(currentInstruction);
    return grouped;
  };
  
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };
  
  const formatTime = (minutes) => {
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds} seconde${seconds !== 1 ? 's' : ''}`;
    }
    return `${Math.round(minutes)} minute${minutes !== 1 ? 's' : ''}`;
  };
  
  const haversineDistance = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371e3; // Earth's radius in meters
    const lat1 = toRad(coords1[0]);
    const lat2 = toRad(coords2[0]);
    const deltaLat = toRad(coords2[0] - coords1[0]);
    const deltaLon = toRad(coords2[1] - coords1[1]);
  
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };
  
  const estimateTime = (distance) => {
    const speed = 40 / 3.6; // 40 km/h in m/s
    const timeInSeconds = distance / speed;
    return timeInSeconds / 60; // Time in minutes
  };
  
  export { groupInstructions, formatDistance, formatTime, haversineDistance, estimateTime };
