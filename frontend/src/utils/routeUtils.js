/**
 * Utilitaires pour le formatage et calculs des routes
 */

/**
 * Calcule la distance entre deux points géographiques (formule de Haversine)
 * @param {Array} point1 - Premier point [latitude, longitude]
 * @param {Array} point2 - Deuxième point [latitude, longitude]
 * @returns {number} - Distance en mètres
 */
export const haversineDistance = (point1, point2) => {
  const R = 6371000 // Rayon de la Terre en mètres
  const lat1 = point1[0]
  const lon1 = point1[1]
  const lat2 = point2[0]
  const lon2 = point2[1]

  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance en mètres
}

/**
 * Estime le temps de trajet basé sur la distance et le type de route
 * @param {number} distanceInMeters - Distance en mètres
 * @param {number} averageSpeedKmh - Vitesse moyenne en km/h (défaut: 90)
 * @returns {number} - Temps estimé en minutes
 */
export const estimateTime = (distanceInMeters, averageSpeedKmh = 90) => {
  const distanceInKm = distanceInMeters / 1000
  const timeInHours = distanceInKm / averageSpeedKmh
  return timeInHours * 60 // Temps en minutes
}

/**
 * Formate la distance en unités lisibles (CORRIGÉ)
 * @param {number} distanceInMeters - Distance en mètres
 * @returns {string} - Distance formatée (ex: "1.2 km" ou "500 m")
 */
export const formatDistance = (distanceInMeters) => {
  if (!distanceInMeters || distanceInMeters < 0) return "0 m"

  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`
  } else {
    const km = (distanceInMeters / 1000).toFixed(1)
    return `${km} km`
  }
}

/**
 * Formate le temps en heures et minutes (CORRIGÉ)
 * @param {number} timeInMinutes - Temps en minutes
 * @returns {string} - Temps formaté (ex: "1h 30min" ou "45 min")
 */
export const formatTime = (timeInMinutes) => {
  if (!timeInMinutes || timeInMinutes < 0) return "0 min"

  const hours = Math.floor(timeInMinutes / 60)
  const minutes = Math.round(timeInMinutes % 60)

  if (hours === 0) {
    return `${minutes} min`
  } else if (minutes === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${minutes}min`
  }
}

/**
 * Formate le temps avec plus de détails (incluant les secondes)
 * @param {number} timeInMinutes - Temps en minutes
 * @returns {string} - Temps formaté détaillé
 */
export const formatTimeDetailed = (timeInMinutes) => {
  const totalSeconds = Math.round(timeInMinutes * 60)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    if (minutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${minutes}min`
    }
  } else if (minutes > 0) {
    return `${minutes}min`
  } else {
    return `${seconds}s`
  }
}

/**
 * Calcule la distance totale d'un itinéraire
 * @param {Array} geometry - Points de l'itinéraire [[lat, lon], ...]
 * @returns {number} - Distance totale en mètres
 */
export const calculateRouteDistance = (geometry) => {
  if (!geometry || geometry.length < 2) return 0

  let totalDistance = 0
  for (let i = 0; i < geometry.length - 1; i++) {
    totalDistance += haversineDistance(geometry[i], geometry[i + 1])
  }
  return totalDistance
}

/**
 * Trouve le point le plus proche sur un itinéraire
 * @param {Array} point - Point de référence [lat, lon]
 * @param {Array} geometry - Points de l'itinéraire
 * @returns {object} - Point le plus proche avec index et distance
 */
export const findClosestPointOnRoute = (point, geometry) => {
  if (!geometry || geometry.length === 0) return null

  let minDistance = Number.POSITIVE_INFINITY
  let closestPoint = null
  let closestIndex = -1

  geometry.forEach((routePoint, index) => {
    const distance = haversineDistance(point, routePoint)
    if (distance < minDistance) {
      minDistance = distance
      closestPoint = routePoint
      closestIndex = index
    }
  })

  return {
    point: closestPoint,
    index: closestIndex,
    distance: minDistance,
  }
}
