function isPointInPolygon(point, polygon) {
    const x = point.lon;
    const y = point.lat;
    let inside = false;
  
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lon;
      const yi = polygon[i].lat;
      const xj = polygon[j].lon;
      const yj = polygon[j].lat;
  
      const intersect =
        ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
  
    return inside;
  }
  
  module.exports = isPointInPolygon;
