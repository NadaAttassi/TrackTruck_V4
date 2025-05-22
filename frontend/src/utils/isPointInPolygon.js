// Fonction pour vérifier si un point est à l'intérieur d'un polygone
// Utilise l'algorithme du "ray casting"
const isPointInPolygon = (point, polygon) => {
  if (!point || !polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return false
  }

  const x = point.lon
  const y = point.lat
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lon
    const yi = polygon[i].lat
    const xj = polygon[j].lon
    const yj = polygon[j].lat

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

export default isPointInPolygon
