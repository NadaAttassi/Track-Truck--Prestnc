/**
 * Utilitaires pour l'analyse et l'affichage des risques
 */

// Couleurs des zones de risque (sans inconnu)
export const riskColors = {
  élevé: "#ff0000",
  moyen: "#ff9900",
  faible: "#33cc33",
  safe: "#9900cc",
}

/**
 * Détermine la classe CSS pour les boutons de route basée sur le risque
 * @param {number} index - Index de la route
 * @param {Array} riskAnalysis - Données d'analyse de risque
 * @param {number} safePathIndex - Index du Safe Path
 * @returns {string} - Classes CSS
 */
export const getRouteButtonClass = (index, riskAnalysis, safePathIndex) => {
  if (riskAnalysis.length <= index || !riskAnalysis[index]) {
    return "low-risk" // Par défaut faible risque au lieu d'inconnu
  }

  if (safePathIndex === index) {
    return "safe-path"
  }

  const riskCounts = riskAnalysis[index].riskCounts
  const highRisk = riskCounts["élevé"] || 0
  const mediumRisk = riskCounts["moyen"] || 0
  const lowRisk = riskCounts["faible"] || 0

  const totalPoints = highRisk + mediumRisk + lowRisk

  if (totalPoints === 0) {
    console.log(`Itinéraire ${index + 1} - Aucun point analysé, considéré comme faible risque.`)
    return "low-risk"
  }

  const riskLevels = [
    { level: "high-risk", count: highRisk, label: "élevé" },
    { level: "medium-risk", count: mediumRisk, label: "moyen" },
    { level: "low-risk", count: lowRisk, label: "faible" },
  ]

  riskLevels.sort((a, b) => b.count - a.count)

  console.log(`Itinéraire ${index + 1} - Points analysés: ${totalPoints}`)
  console.log(`  Élevés: ${highRisk}, Moyens: ${mediumRisk}, Faibles: ${lowRisk}`)
  console.log(`  Niveau de risque le plus fréquent: ${riskLevels[0].label} (${riskLevels[0].count} points)`)

  return riskLevels[0].level
}

/**
 * Calcule le score de risque total pour une route
 * @param {object} riskCounts - Comptages de risque par niveau
 * @returns {number} - Score de risque total (plus bas = meilleur)
 */
export const calculateRiskScore = (riskCounts) => {
  if (!riskCounts) return 0

  const high = riskCounts["élevé"] || 0
  const medium = riskCounts["moyen"] || 0
  const low = riskCounts["faible"] || 0

  // ✅ CORRECTION: Même logique que le backend
  // Plus il y a de zones à risque, plus le score est élevé (donc mauvais)
  return high * 100 + medium * 10 + low * 1
}

/**
 * Détermine le niveau de risque global d'une route
 * @param {object} riskCounts - Comptages de risque par niveau
 * @returns {object} - Niveau de risque avec label et couleur
 */
export const getRiskLevel = (riskCounts) => {
  if (!riskCounts) {
    return {
      level: "low",
      label: "Risque faible",
      color: "text-green-600 bg-green-50",
      icon: "🟢",
    }
  }

  const high = riskCounts["élevé"] || 0
  const medium = riskCounts["moyen"] || 0
  const low = riskCounts["faible"] || 0
  const total = high + medium + low

  if (total === 0) {
    return {
      level: "low",
      label: "Risque faible",
      color: "text-green-600 bg-green-50",
      icon: "🟢",
    }
  }

  if (high > 0) {
    const highPercentage = (high / total) * 100
    if (highPercentage > 20) {
      return {
        level: "very-high",
        label: "Risque très élevé",
        color: "text-red-700 bg-red-100",
        icon: "🔴",
      }
    } else if (highPercentage > 10) {
      return {
        level: "high",
        label: "Risque élevé",
        color: "text-red-600 bg-red-50",
        icon: "🔴",
      }
    }
  }

  if (medium > 0) {
    const mediumPercentage = (medium / total) * 100
    if (mediumPercentage > 30) {
      return {
        level: "medium-high",
        label: "Risque moyen-élevé",
        color: "text-orange-600 bg-orange-50",
        icon: "🟠",
      }
    } else if (mediumPercentage > 15) {
      return {
        level: "medium",
        label: "Risque moyen",
        color: "text-yellow-600 bg-yellow-50",
        icon: "🟡",
      }
    }
  }

  return {
    level: "low",
    label: "Risque faible",
    color: "text-green-600 bg-green-50",
    icon: "🟢",
  }
}

/**
 * Formate les données de risque pour l'affichage
 * @param {object} riskData - Données de risque brutes
 * @returns {object} - Données formatées
 */
export const formatRiskData = (riskData) => {
  if (!riskData) {
    return {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      percentage: {
        high: 0,
        medium: 0,
        low: 0,
      },
    }
  }

  const total = riskData.totalPoints || 0
  const high = riskData.riskCounts?.["élevé"] || 0
  const medium = riskData.riskCounts?.["moyen"] || 0
  const low = riskData.riskCounts?.["faible"] || 0

  return {
    total,
    high,
    medium,
    low,
    percentage: {
      high: total > 0 ? Math.round((high / total) * 100) : 0,
      medium: total > 0 ? Math.round((medium / total) * 100) : 0,
      low: total > 0 ? Math.round((low / total) * 100) : 0,
    },
  }
}

/**
 * Compare deux routes basé sur leur niveau de risque
 * @param {object} route1Risk - Données de risque route 1
 * @param {object} route2Risk - Données de risque route 2
 * @returns {number} - -1 si route1 est plus sûre, 1 si route2 est plus sûre, 0 si égales
 */
export const compareRouteRisk = (route1Risk, route2Risk) => {
  const score1 = calculateRiskScore(route1Risk?.riskCounts)
  const score2 = calculateRiskScore(route2Risk?.riskCounts)

  if (score1 < score2) return -1
  if (score1 > score2) return 1
  return 0
}

/**
 * Génère un résumé textuel du risque d'une route
 * @param {object} riskData - Données de risque
 * @returns {string} - Résumé textuel
 */
export const generateRiskSummary = (riskData) => {
  if (!riskData) return "Aucune donnée de risque disponible"

  const formatted = formatRiskData(riskData)
  const riskLevel = getRiskLevel(riskData.riskCounts)

  if (formatted.total === 0) {
    return "Aucun point analysé"
  }

  if (formatted.high === 0 && formatted.medium === 0) {
    return `Route sûre - ${formatted.low} points à faible risque`
  }

  if (formatted.high > 0) {
    return `${riskLevel.label} - ${formatted.high} points à risque élevé détectés`
  }

  if (formatted.medium > 0) {
    return `${riskLevel.label} - ${formatted.medium} points à risque moyen`
  }

  return `${riskLevel.label}`
}
