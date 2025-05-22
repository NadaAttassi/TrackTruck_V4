// Améliorer les couleurs des zones de risque pour une meilleure visibilité
const riskColors = {
  élevé: "#ff0000",
  moyen: "#ff9900",
  faible: "#33cc33",
  inconnu: "#999999",
  safe: "#9900cc",
}

const getRouteButtonClass = (index, riskAnalysis, safePathIndex) => {
  if (riskAnalysis.length <= index || !riskAnalysis[index]) {
    return "unknown-risk"
  }

  if (safePathIndex === index) {
    return "safe-path"
  }

  const riskCounts = riskAnalysis[index].riskCounts
  const highRisk = riskCounts["élevé"] || 0
  const mediumRisk = riskCounts["moyen"] || 0
  const lowRisk = riskCounts["faible"] || 0
  const unknownRisk = riskCounts["inconnu"] || 0

  const totalNonUnknownPoints = highRisk + mediumRisk + lowRisk

  if (totalNonUnknownPoints === 0) {
    console.log(`Itinéraire ${index + 1} - Tous les points sont inconnus.`)
    return "unknown-risk"
  }

  const riskLevels = [
    { level: "high-risk", count: highRisk, label: "élevé" },
    { level: "medium-risk", count: mediumRisk, label: "moyen" },
    { level: "low-risk", count: lowRisk, label: "faible" },
  ]

  riskLevels.sort((a, b) => b.count - a.count)

  console.log(`Itinéraire ${index + 1} - Points non inconnus: ${totalNonUnknownPoints}`)
  console.log(`  Élevés: ${highRisk}, Moyens: ${mediumRisk}, Faibles: ${lowRisk}, Inconnus: ${unknownRisk}`)
  console.log(`  Niveau de risque le plus fréquent: ${riskLevels[0].label} (${riskLevels[0].count} points)`)

  return riskLevels[0].level
}

export { riskColors, getRouteButtonClass }
