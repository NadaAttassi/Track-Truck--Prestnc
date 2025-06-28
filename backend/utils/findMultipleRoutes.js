const aStar = require("./aStar")
const generateInstructions = require("./generateInstructions")
const haversineDistance = require("./haversineDistance")

function findMultipleRoutes(startNodeId, endNodeId, nodes, edges, wayNames, endLat, endLon, alternatives) {
  const routes = []
  const k = Math.min(alternatives || 10, 10) // Limiter à 10 itinéraires maximum
  const usedEdges = new Set() // Pour suivre les arêtes utilisées

  for (let i = 0; i < k; i++) {
    const path = aStar(startNodeId, endNodeId, nodes, edges)
    if (path.length === 0) {
      console.log(`Itinéraire ${i + 1} non trouvé`)
      break
    }

    // Calculer la géométrie et la distance
    const geometry = path.map((nodeId) => ({
      lat: nodes.get(nodeId).lat,
      lon: nodes.get(nodeId).lon,
    }))

    const lastNode = geometry[geometry.length - 1]
    const distanceToEndKm = haversineDistance(lastNode.lat, lastNode.lon, endLat, endLon)
    if (distanceToEndKm > 0.001) {
      geometry.push({ lat: endLat, lon: endLon })
    }

    // Calculer la distance totale en kilomètres
    let totalDistanceKm = 0
    for (let j = 0; j < path.length - 1; j++) {
      const edgeData = edges.get(path[j]).get(path[j + 1])
      totalDistanceKm += edgeData.distance // edgeData.distance est déjà en km
    }
    totalDistanceKm += distanceToEndKm // Ajouter la distance finale

    // Calculer la durée en minutes (vitesse moyenne 40 km/h)
    const averageSpeedKmh = 40
    const durationInHours = totalDistanceKm / averageSpeedKmh
    const durationInMinutes = durationInHours * 60

    // Calculer un score (exemple simple, à adapter selon logique métier)
    const score = (1 - Math.min(1, Math.random())).toFixed(4)
    // Statistiques de risque (exemple, à adapter)
    const stats = { "élevé": 0, "moyen": 0, "faible": 0 }
    // isSafe selon un seuil arbitraire sur riskLevel (à adapter)
    const riskLevel = Math.random()
    const isSafe = riskLevel < 0.5

    routes.push({
      geometry: geometry.map((coord) => [coord.lat, coord.lon]),
      instructions: generateInstructions(path, nodes, wayNames),
      distance: totalDistanceKm * 1000, // Convertir en mètres pour l'affichage
      duration: durationInMinutes,
      riskLevel,
      score,
      stats,
      isSafe
    })

    console.log(
      `Itinéraire ${i + 1} trouvé - Distance: ${totalDistanceKm.toFixed(2)} km - Durée: ${durationInMinutes.toFixed(2)} minutes`,
    )

    // Augmenter les poids des arêtes utilisées pour forcer A* à trouver un autre chemin
    for (let j = 0; j < path.length - 1; j++) {
      const fromNode = path[j]
      const toNode = path[j + 1]
      const edgeKey = `${fromNode}-${toNode}`
      if (!usedEdges.has(edgeKey)) {
        usedEdges.add(edgeKey)
        usedEdges.add(`${toNode}-${fromNode}`) // Bidirectionnel
        const edgeData = edges.get(fromNode).get(toNode)
        edgeData.distance = edgeData.originalDistance * 10 // Augmenter le poids
        edges.get(toNode).set(fromNode, edgeData) // Mettre à jour dans les deux sens
      }
    }
  }

  // Réinitialiser les poids des arêtes pour les futures requêtes
  for (const [fromNode, neighbors] of edges) {
    for (const [toNode, edgeData] of neighbors) {
      edgeData.distance = edgeData.originalDistance
      edges.get(fromNode).set(toNode, edgeData)
      edges.get(toNode).set(fromNode, edgeData)
    }
  }

  return routes
}

module.exports = findMultipleRoutes
