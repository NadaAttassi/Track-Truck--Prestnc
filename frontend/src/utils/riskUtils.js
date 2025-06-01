/**
 * Utilitaires pour l'analyse et l'affichage des risques
 */

// Couleurs des zones de risque basées sur le score numérique
export const riskColors = {
  élevé: "#dc3545",    // Rouge pour risque >= 0.7
  moyen: "#ffc107",    // Jaune pour risque >= 0.5
  faible: "#28a745",   // Vert pour risque < 0.5
  safe: "#6f42c1",     // Violet pour le safe path
}

// Seuils de risque
export const RISK_THRESHOLDS = {
  HIGH: 0.7,
  MEDIUM: 0.5
}

/**
 * Détermine la catégorie de risque basée sur le score numérique
 * @param {number} riskScore - Score de risque entre 0 et 1
 * @returns {string} - Catégorie de risque (élevé, moyen, faible)
 */
export const getRiskCategory = (riskScore) => {
  if (riskScore >= RISK_THRESHOLDS.HIGH) return "élevé"
  if (riskScore >= RISK_THRESHOLDS.MEDIUM) return "moyen"
  return "faible"
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
    return "low-risk"
  }

  if (safePathIndex === index) {
    return "safe-path"
  }

  const riskScore = riskAnalysis[index].averageRiskScore || 0
  const category = getRiskCategory(riskScore)

  console.log(`Itinéraire ${index + 1} - Score de risque: ${riskScore.toFixed(4)} (${category})`)

  switch (category) {
    case "élevé": return "high-risk"
    case "moyen": return "medium-risk"
    default: return "low-risk"
  }
}

/**
 * Détermine le niveau de risque global d'une route
 * @param {object} riskData - Données de risque
 * @returns {object} - Niveau de risque avec label et couleur
 */
export const getRiskLevel = (riskData) => {
  if (!riskData || typeof riskData.averageRiskScore !== 'number') {
    return {
      level: "low",
      label: "Risque faible",
      color: "text-green-600 bg-green-50",
      icon: "🟢",
    }
  }

  const riskScore = riskData.averageRiskScore

  if (riskScore >= RISK_THRESHOLDS.HIGH) {
    return {
      level: "very-high",
      label: "Risque très élevé",
      color: "text-red-700 bg-red-100",
      icon: "🔴",
    }
  } else if (riskScore >= RISK_THRESHOLDS.MEDIUM) {
    return {
      level: "medium",
      label: "Risque moyen",
      color: "text-yellow-600 bg-yellow-50",
      icon: "🟡",
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
      riskScore: 0,
      stats: {
        total: 0,
        élevé: 0,
        moyen: 0,
        faible: 0
      }
    }
  }

  const riskScore = riskData.averageRiskScore || 0
  const stats = riskData.riskStats || {}

  return {
    riskScore,
    stats: {
      total: (stats.élevé || 0) + (stats.moyen || 0) + (stats.faible || 0),
      élevé: stats.élevé || 0,
      moyen: stats.moyen || 0,
      faible: stats.faible || 0
    }
  }
}

/**
 * Compare deux routes basé sur leur niveau de risque
 * @param {object} route1Risk - Données de risque route 1
 * @param {object} route2Risk - Données de risque route 2
 * @returns {number} - -1 si route1 est plus sûre, 1 si route2 est plus sûre, 0 si égales
 */
export const compareRouteRisk = (route1Risk, route2Risk) => {
  const score1 = route1Risk?.averageRiskScore || 0
  const score2 = route2Risk?.averageRiskScore || 0

  if (score1 < score2) return -1
  if (score1 > score2) return 1
  return 0
}

/**
 * Génère un résumé du risque pour l'affichage
 * @param {object} riskData - Données de risque
 * @returns {string} - Résumé formaté
 */
export const generateRiskSummary = (riskData) => {
  if (!riskData || typeof riskData.averageRiskScore !== 'number') {
    return "Analyse de risque non disponible"
  }

  const riskScore = riskData.averageRiskScore
  const category = getRiskCategory(riskScore)
  const stats = riskData.riskStats || {}

  return `Score de risque: ${(riskScore * 100).toFixed(1)}% (${category})
Zones: ${stats.élevé || 0} élevées, ${stats.moyen || 0} moyennes, ${stats.faible || 0} faibles`
}
