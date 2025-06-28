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
 * @param {number} riskScore - Score de risque entre 0 et 1
 * @param {boolean} isSelected - Si la route est sélectionnée
 * @param {boolean} isSafePath - Si c'est le Safe Path
 * @returns {string} - Classes CSS
 */
export const getRouteButtonClass = (riskScore, isSelected, isSafePath) => {
  // Si c'est le Safe Path, on utilise la classe spéciale mauve
  if (isSafePath) {
    return isSelected ? 'route-button safe-path selected' : 'route-button safe-path';
  }

  // Vérifier que riskScore est un nombre valide
  const score = typeof riskScore === 'number' ? riskScore : 0;
  
  // Déterminer la classe en fonction du score de risque
  if (score >= 0.7) {
    return isSelected ? 'route-button high-risk selected' : 'route-button high-risk';
  } else if (score >= 0.4) {
    return isSelected ? 'route-button medium-risk selected' : 'route-button medium-risk';
  } else {
    return isSelected ? 'route-button low-risk selected' : 'route-button low-risk';
  }
};

// Fonction pour obtenir la couleur en fonction du score de risque
export const getRiskColor = (riskScore) => {
  const score = typeof riskScore === 'number' ? riskScore : 0;
  if (score >= 0.7) return '#dc3545'; // Rouge
  if (score >= 0.4) return '#ffc107'; // Jaune
  return '#28a745'; // Vert
};

// Fonction pour obtenir la couleur de fond en fonction du score de risque
export const getRiskBackgroundColor = (riskScore, opacity = 1) => {
  const score = typeof riskScore === 'number' ? riskScore : 0;
  if (score >= 0.7) return `rgba(220, 53, 69, ${opacity})`; // Rouge
  if (score >= 0.4) return `rgba(255, 193, 7, ${opacity})`; // Jaune
  return `rgba(40, 167, 69, ${opacity})`; // Vert
};

// Fonction pour obtenir le libellé de risque
export const getRiskLabel = (riskScore) => {
  const score = typeof riskScore === 'number' ? riskScore : 0;
  if (score >= 0.7) return 'Élevé';
  if (score >= 0.4) return 'Moyen';
  return 'Faible';
};

// Fonction pour obtenir l'icône de risque
export const getRiskIcon = (riskScore) => {
  const score = typeof riskScore === 'number' ? riskScore : 0;
  if (score >= 0.7) return '🔴';
  if (score >= 0.4) return '🟡';
  return '🟢';
};

// Fonction pour formater le score de risque en pourcentage
export const formatRiskScore = (riskScore) => {
  const score = typeof riskScore === 'number' ? riskScore : 0;
  return Math.round(score * 100) + '%';
};

// Fonction pour obtenir la description du niveau de risque
export const getRiskDescription = (riskScore) => {
  const score = typeof riskScore === 'number' ? riskScore : 0;
  
  if (score >= 0.7) {
    return 'Risque élevé - Soyez extrêmement prudent et envisagez un itinéraire alternatif.';
  }
  if (score >= 0.4) {
    return 'Risque modéré - Restez vigilant et respectez les règles de sécurité.';
  }
  return 'Risque faible - Itinéraire relativement sûr.';
};

// Fonction pour normaliser les données de risque
export const normalizeRiskData = (riskData) => {
  if (!riskData) {
    return {
      averageRiskScore: 0,
      riskStats: {
        élevé: 0,
        moyen: 0,
        faible: 0
      },
      detectedZones: [],
      detectedRisks: []
    };
  }
  
  // Si c'est un tableau, retourner le premier élément normalisé
  if (Array.isArray(riskData) && riskData.length > 0) {
    return normalizeRiskData(riskData[0]);
  }
  
  // Retourner un objet normalisé
  return {
    // Utiliser averageRiskScore avec fallback sur riskScore
    averageRiskScore: typeof riskData.averageRiskScore === 'number' 
      ? riskData.averageRiskScore 
      : (typeof riskData.riskScore === 'number' ? riskData.riskScore : 0),
      
    // S'assurer que riskStats est défini et contient les bonnes propriétés
    riskStats: {
      élevé: riskData.riskStats?.['élevé'] || 0,
      moyen: riskData.riskStats?.moyen || 0,
      faible: riskData.riskStats?.faible || 0
    },
    
    // S'assurer que les tableaux sont définis
    detectedZones: Array.isArray(riskData.detectedZones) ? riskData.detectedZones : [],
    detectedRisks: Array.isArray(riskData.detectedRisks) ? riskData.detectedRisks : []
  };
};

// Fonction pour obtenir un résumé des statistiques de risque
export const getRiskSummary = (riskData) => {
  const normalized = normalizeRiskData(riskData);
  
  return {
    score: normalized.averageRiskScore,
    level: getRiskLabel(normalized.averageRiskScore),
    icon: getRiskIcon(normalized.averageRiskScore),
    color: getRiskColor(normalized.averageRiskScore),
    stats: normalized.riskStats,
    totalRisks: Object.values(normalized.riskStats).reduce((sum, count) => sum + count, 0)
  };
};

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
