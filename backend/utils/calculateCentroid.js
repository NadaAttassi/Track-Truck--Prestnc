// Nouvelle fonction pour calculer le centre de gravité d'une zone
function calculateCentroid(geometry) {
  if (!geometry || geometry.length === 0) {
    return null
  }

  let totalLat = 0
  let totalLon = 0

  for (const point of geometry) {
    totalLat += point.lat
    totalLon += point.lon
  }

  return {
    lat: totalLat / geometry.length,
    lon: totalLon / geometry.length,
  }
}

module.exports = calculateCentroid
