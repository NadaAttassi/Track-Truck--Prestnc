const express = require("express")
const router = express.Router()
const isPointInPolygon = require("./utils/isPointInPolygon")

// Fonction pour calculer la distance Haversine
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Rayon de la Terre en mètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance en mètres
}

// Fonction pour calculer le centre de gravité
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

// Fonction pour vérifier si un segment de ligne intersecte un polygone
function lineIntersectsPolygon(lineStart, lineEnd, polygon) {
  if (isPointInPolygon(lineStart, polygon) || isPointInPolygon(lineEnd, polygon)) {
    return true
  }

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    const polySegStart = polygon[i]
    const polySegEnd = polygon[j]

    if (
      linesIntersect(
        lineStart.lat,
        lineStart.lon,
        lineEnd.lat,
        lineEnd.lon,
        polySegStart.lat,
        polySegStart.lon,
        polySegEnd.lat,
        polySegEnd.lon,
      )
    ) {
      return true
    }
  }

  return false
}

// Fonction pour vérifier si deux segments de ligne se croisent
function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const o1 = orientation(x1, y1, x2, y2, x3, y3)
  const o2 = orientation(x1, y1, x2, y2, x4, y4)
  const o3 = orientation(x3, y3, x4, y4, x1, y1)
  const o4 = orientation(x3, y3, x4, y4, x2, y2)

  if (o1 !== o2 && o3 !== o4) return true

  if (o1 === 0 && onSegment(x1, y1, x3, y3, x2, y2)) return true
  if (o2 === 0 && onSegment(x1, y1, x4, y4, x2, y2)) return true
  if (o3 === 0 && onSegment(x3, y3, x1, y1, x4, y4)) return true
  if (o4 === 0 && onSegment(x3, y3, x2, y2, x4, y4)) return true

  return false
}

// Fonction pour déterminer l'orientation de trois points
function orientation(x1, y1, x2, y2, x3, y3) {
  const val = (y2 - y1) * (x3 - x2) - (x2 - x1) * (y3 - y2)
  if (val === 0) return 0 // colinéaire
  return val > 0 ? 1 : 2 // horaire ou anti-horaire
}

// Fonction pour vérifier si un point est sur un segment
function onSegment(x1, y1, x2, y2, x3, y3) {
  return x2 <= Math.max(x1, x3) && x2 >= Math.min(x1, x3) && y2 <= Math.max(y1, y3) && y2 >= Math.min(y1, y3)
}

// Fonction pour générer des points intermédiaires entre deux points
function generateIntermediatePoints(point1, point2, count = 10) {
  const points = []
  for (let i = 0; i <= count; i++) {
    const ratio = i / count
    points.push({
      lat: point1.lat + (point2.lat - point1.lat) * ratio,
      lon: point1.lon + (point2.lon - point1.lon) * ratio,
    })
  }
  return points
}

// Route pour analyser les points à risque
router.post("/analyze-risk", async (req, res) => {
  try {
    const { routes, zones } = req.body

    if (!routes || !Array.isArray(routes) || !zones || !Array.isArray(zones)) {
      return res.status(400).json({
        success: false,
        message: "Les itinéraires et les zones doivent être des tableaux valides",
      })
    }

    console.log("🔍 ANALYSE DES RISQUES - Début")
    console.log(`📊 ${routes.length} itinéraires à analyser`)
    console.log(`🗺️ ${zones.length} zones de risque disponibles`)

    // Pré-calculer les centres de gravité
    const zonesWithCentroids = zones.map((zone, zoneIndex) => {
      const centroid = calculateCentroid(zone.geometry)
      console.log(
        `📍 Zone ${zone.zoneId || zoneIndex}: ${zone.risk || "inconnu"} - Centroïde: ${centroid ? `${centroid.lat.toFixed(4)}, ${centroid.lon.toFixed(4)}` : "non calculé"}`,
      )
      return {
        ...zone,
        centroid: centroid,
      }
    })

    console.log(`📍 ${zonesWithCentroids.filter((z) => z.centroid).length} zones avec centroïdes calculés`)

    // Seuil de proximité pour la détection par distance
    const proximityThreshold = 300

    const riskAnalysis = routes.map((route, routeIndex) => {
      const geometry = route.geometry || []
      if (!Array.isArray(geometry)) {
        console.warn(`⚠️ Itinéraire ${routeIndex + 1} - Géométrie invalide`)
        return {
          routeIndex: routeIndex,
          riskCounts: { élevé: 0, moyen: 0, faible: 0 },
          totalPoints: 0,
        }
      }

      console.log(`\n🛣️ ANALYSE ITINÉRAIRE ${routeIndex + 1}`)
      console.log(`📍 ${geometry.length} points à analyser`)

      const riskCounts = { élevé: 0, moyen: 0, faible: 0 }
      const detectedRisks = []
      const detectedZoneIds = new Set()

      // MÉTHODE 1: Échantillonnage dense pour la détection par point
      const sampleRate = Math.max(1, Math.floor(geometry.length / 500))
      const sampledGeometry = geometry.filter((_, index) => index % sampleRate === 0)

      console.log(`🎯 ${sampledGeometry.length} points échantillonnés (taux: 1/${sampleRate})`)

      // Analyser chaque point échantillonné
      sampledGeometry.forEach((point, pointIndex) => {
        const pointObj = {
          lat: point[0],
          lon: point[1],
        }

        for (const zone of zonesWithCentroids) {
          if (!zone.geometry || zone.geometry.length < 3) continue

          const zoneRisk = zone.risk?.toLowerCase()
          if (!zoneRisk || !["élevé", "moyen", "faible"].includes(zoneRisk)) continue

          if (isPointInPolygon(pointObj, zone.geometry)) {
            if (!detectedZoneIds.has(zone.zoneId)) {
              detectedZoneIds.add(zone.zoneId)
              riskCounts[zoneRisk] = (riskCounts[zoneRisk] || 0) + 1
              detectedRisks.push({
                point: pointIndex,
                risk: zoneRisk,
                method: "DANS_ZONE",
                zone: zone.zoneId,
                distance: 0,
                coordinates: [pointObj.lat, pointObj.lon],
              })
              console.log(`✅ Point ${pointIndex + 1} DANS zone ${zone.zoneId} - Risque: ${zoneRisk}`)
            }
          }
        }
      })

      // MÉTHODE 2: Analyse des segments pour détecter les intersections avec les zones
      console.log(`🔍 Analyse des segments de l'itinéraire...`)
      for (let i = 0; i < geometry.length - 1; i++) {
        const startPoint = { lat: geometry[i][0], lon: geometry[i][1] }
        const endPoint = { lat: geometry[i + 1][0], lon: geometry[i + 1][1] }

        const segmentLength = haversineDistance(startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon)
        const intermediatePointCount = Math.max(5, Math.ceil(segmentLength / 50))
        const intermediatePoints = generateIntermediatePoints(startPoint, endPoint, intermediatePointCount)

        for (const point of intermediatePoints) {
          for (const zone of zonesWithCentroids) {
            if (!zone.geometry || zone.geometry.length < 3) continue

            const zoneRisk = zone.risk?.toLowerCase()
            if (!zoneRisk || !["élevé", "moyen", "faible"].includes(zoneRisk)) continue

            if (isPointInPolygon(point, zone.geometry)) {
              if (!detectedZoneIds.has(zone.zoneId)) {
                detectedZoneIds.add(zone.zoneId)
                riskCounts[zoneRisk] = (riskCounts[zoneRisk] || 0) + 1
                detectedRisks.push({
                  segment: i,
                  risk: zoneRisk,
                  method: "SEGMENT_INTERSECTION",
                  zone: zone.zoneId,
                  distance: 0,
                  coordinates: [point.lat, point.lon],
                })
                console.log(`🔄 Segment ${i} INTERSECTE zone ${zone.zoneId} - Risque: ${zoneRisk}`)
              }
            }
          }
        }
      }

      // MÉTHODE 3: Vérification par proximité avec les centres de gravité
      console.log(`🔍 Vérification par proximité avec les centres de gravité...`)
      for (const point of sampledGeometry) {
        const pointObj = { lat: point[0], lon: point[1] }

        for (const zone of zonesWithCentroids) {
          if (!zone.centroid) continue

          const zoneRisk = zone.risk?.toLowerCase()
          if (!zoneRisk || !["élevé", "moyen", "faible"].includes(zoneRisk)) continue

          const distance = haversineDistance(pointObj.lat, pointObj.lon, zone.centroid.lat, zone.centroid.lon)

          if (distance <= proximityThreshold && !detectedZoneIds.has(zone.zoneId)) {
            detectedZoneIds.add(zone.zoneId)
            riskCounts[zoneRisk] = (riskCounts[zoneRisk] || 0) + 1
            detectedRisks.push({
              risk: zoneRisk,
              method: "PROXIMITE_CENTROIDE",
              zone: zone.zoneId,
              distance: distance,
              coordinates: [pointObj.lat, pointObj.lon],
            })
            console.log(`🔶 PROCHE centroïde zone ${zone.zoneId} (${distance.toFixed(1)}m) - Risque: ${zoneRisk}`)
          }
        }
      }

      console.log(`📊 RÉSULTATS Itinéraire ${routeIndex + 1}:`)
      console.log(`   🔴 Élevé: ${riskCounts["élevé"]} zones`)
      console.log(`   🟡 Moyen: ${riskCounts["moyen"]} zones`)
      console.log(`   🟢 Faible: ${riskCounts["faible"]} zones`)
      console.log(`   📍 Total zones détectées: ${detectedZoneIds.size}`)
      console.log(`   🎯 Points analysés: ${sampledGeometry.length}`)

      if (detectedRisks.length > 0) {
        console.log(`   📋 Exemples de détections:`)
        detectedRisks.slice(0, 5).forEach((risk) => {
          console.log(`      - Zone ${risk.zone}: ${risk.risk} (${risk.method}, ${risk.distance?.toFixed(1) || 0}m)`)
        })
      } else {
        console.log(`   ⚠️ AUCUNE DÉTECTION - Vérifier les zones et la géométrie`)
      }

      return {
        routeIndex: routeIndex,
        riskCounts,
        totalPoints: sampledGeometry.length,
        detectedZones: Array.from(detectedZoneIds),
        detectedRisks: detectedRisks,
      }
    })

    // CALCUL DU SAFE PATH
    console.log("\n🛡️ CALCUL DU SAFE PATH")

    let bestRouteIndex = 0
    let maxSafetyScore = -Infinity

    const routeScores = riskAnalysis.map((analysis, idx) => {
      const riskCounts = analysis.riskCounts
      const highRiskPoints = riskCounts["élevé"] || 0
      const mediumRiskPoints = riskCounts["moyen"] || 0
      const lowRiskPoints = riskCounts["faible"] || 0
      const totalRiskPoints = highRiskPoints + mediumRiskPoints + lowRiskPoints

      // Calcul du safetyScore comme dans RouteAnalysis
      let safetyScore = 100
      if (totalRiskPoints > 0) {
        const riskPercentage = Math.round((highRiskPoints / totalRiskPoints) * 100)
        safetyScore = Math.max(0, 100 - riskPercentage)
      }

      console.log(`🔍 Itinéraire ${idx + 1}:`)
      console.log(`   🔴 Élevé: ${highRiskPoints}`)
      console.log(`   🟡 Moyen: ${mediumRiskPoints}`)
      console.log(`   🟢 Faible: ${lowRiskPoints}`)
      console.log(`   📊 Safety Score: ${safetyScore}`)

      if (safetyScore > maxSafetyScore) {
        maxSafetyScore = safetyScore
        bestRouteIndex = idx
        console.log(`   🏆 NOUVEAU MEILLEUR: Itinéraire ${idx + 1} avec safetyScore ${safetyScore}`)
      }

      return {
        ...analysis,
        safetyScore,
      }
    })

    console.log(`\n🛡️ SAFE PATH FINAL: Itinéraire ${bestRouteIndex + 1}`)
    console.log(`📊 Safety Score: ${maxSafetyScore} (plus haut = meilleur)`)

    // Statistiques simplifiées
    const totalDetections = routeScores.reduce((sum, route) => {
      return (
        sum + (route.riskCounts["élevé"] || 0) + (route.riskCounts["moyen"] || 0) + (route.riskCounts["faible"] || 0)
      )
    }, 0)

    console.log(`\n📈 STATISTIQUES GLOBALES:`)
    console.log(`   🎯 Total zones détectées: ${totalDetections}`)
    console.log(`   🗺️ Zones avec centroïdes: ${zonesWithCentroids.filter((z) => z.centroid).length}`)
    console.log(`   📏 Seuil de proximité: ${proximityThreshold}m`)

    res.json({
      success: true,
      analysis: routeScores,
      safePathIndex: bestRouteIndex,
      safePathScore: maxSafetyScore,
      bestRoute: {
        index: bestRouteIndex,
        safetyScore: maxSafetyScore,
        details: routeScores[bestRouteIndex],
      },
      debug: {
        proximityThreshold,
        totalZones: zones.length,
        totalDetections,
        zonesWithCentroids: zonesWithCentroids.filter((z) => z.centroid).length,
        analysisMethod: "multi-méthode: points + segments + proximité",
      },
    })
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse des points à risque:", error.message)
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'analyse des points à risque",
      details: error.message,
    })
  }
})

module.exports = router