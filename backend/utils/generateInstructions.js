const haversineDistance = require("./haversineDistance")

// Dictionnaire de traduction AMÉLIORÉ pour les types de routes
const roadTypeTranslations = {
  motorway: "autoroute",
  trunk: "voie rapide",
  primary: "route principale",
  secondary: "route secondaire",
  tertiary: "route tertiaire",
  residential: "rue résidentielle",
  trunk_link: "bretelle de voie rapide",
  primary_link: "bretelle de route principale",
  secondary_link: "bretelle de route secondaire",
  tertiary_link: "bretelle de route tertiaire",
  motorway_link: "bretelle d'autoroute",
  unclassified: "route non classée",
  service: "voie de service",
  living_street: "zone résidentielle",
  pedestrian: "zone piétonne",
  track: "chemin",
  path: "sentier",
  footway: "trottoir",
  cycleway: "piste cyclable",
  steps: "escaliers",
  // Ajout de traductions spécifiques
  "route principale link": "bretelle de route principale",
  "route secondaire link": "bretelle de route secondaire",
  "voie rapide link": "bretelle de voie rapide",
}

function translateRoadName(roadName) {
  if (!roadName || roadName === "Route sans nom") {
    return "route sans nom"
  }

  // Nettoyer le nom de la route
  let translatedName = roadName.toLowerCase()

  // Remplacer les types de routes anglais par leurs équivalents français
  Object.keys(roadTypeTranslations).forEach((englishType) => {
    const frenchType = roadTypeTranslations[englishType]
    // Remplacer les occurrences exactes
    translatedName = translatedName.replace(new RegExp(`\\b${englishType}\\b`, "g"), frenchType)
    // Remplacer les occurrences avec underscores
    translatedName = translatedName.replace(new RegExp(`${englishType}_`, "g"), `${frenchType} `)
    translatedName = translatedName.replace(new RegExp(`_${englishType}`, "g"), ` ${frenchType}`)
  })

  // Nettoyer les underscores restants
  translatedName = translatedName.replace(/_/g, " ")

  // Nettoyer les espaces multiples
  translatedName = translatedName.replace(/\s+/g, " ").trim()

  // Traductions spécifiques pour les cas problématiques
  translatedName = translatedName.replace(/\blink\b/g, "bretelle")
  translatedName = translatedName.replace(/\bsecondary link\b/g, "bretelle de route secondaire")
  translatedName = translatedName.replace(/\bprimary link\b/g, "bretelle de route principale")
  translatedName = translatedName.replace(/\btrunk link\b/g, "bretelle de voie rapide")

  // Capitaliser la première lettre
  return translatedName.charAt(0).toUpperCase() + translatedName.slice(1)
}

function generateInstructions(path, nodes, wayNames) {
  const instructions = []
  let currentInstruction = null
  let accumulatedDistance = 0

  for (let i = 0; i < path.length; i++) {
    if (i === 0) {
      instructions.push({
        text: "Départ",
        point: [nodes.get(path[i]).lat, nodes.get(path[i]).lon],
        distance: 0,
      })
      continue
    }
    if (i === path.length - 1) {
      instructions.push({
        text: "Arrivée",
        point: [nodes.get(path[i]).lat, nodes.get(path[i]).lon],
        distance: 0,
      })
      continue
    }

    if (i < path.length - 1) {
      const prevNode = nodes.get(path[i - 1])
      const currentNode = nodes.get(path[i])
      const nextNode = nodes.get(path[i + 1])

      const vector1 = {
        x: currentNode.lon - prevNode.lon,
        y: currentNode.lat - prevNode.lat,
      }
      const vector2 = {
        x: nextNode.lon - currentNode.lon,
        y: nextNode.lat - currentNode.lat,
      }

      const crossProduct = vector1.x * vector2.y - vector1.y * vector2.x
      const angleDeg = (Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x)) * (180 / Math.PI)

      let instructionText = "Continuer tout droit"
      if (Math.abs(angleDeg) > 30) {
        instructionText = crossProduct > 0 ? "Tourner à droite" : "Tourner à gauche"
      }

      const rawRoadName = wayNames.get(`${path[i]}-${path[i + 1]}`) || "Route sans nom"
      const translatedRoadName = translateRoadName(rawRoadName)
      instructionText += ` sur ${translatedRoadName}`

      // CORRECTION : Calculer la distance correctement en mètres
      const distanceInKm = haversineDistance(currentNode.lat, currentNode.lon, nextNode.lat, nextNode.lon)
      const distanceInMeters = distanceInKm * 1000 // Convertir km en mètres

      if (currentInstruction && currentInstruction.text === instructionText) {
        // Accumuler la distance pour la même instruction
        accumulatedDistance += distanceInMeters
        currentInstruction.distance = accumulatedDistance
        currentInstruction.point = [currentNode.lat, currentNode.lon]
      } else {
        // Nouvelle instruction
        if (currentInstruction) {
          instructions.push(currentInstruction)
        }
        accumulatedDistance = distanceInMeters
        currentInstruction = {
          text: instructionText,
          point: [currentNode.lat, currentNode.lon],
          distance: accumulatedDistance, // Distance en mètres
        }
      }
    }
  }

  if (currentInstruction) {
    instructions.push(currentInstruction)
  }

  // Log pour debug
  console.log("Instructions générées:")
  instructions.forEach((inst, idx) => {
    console.log(`${idx + 1}. ${inst.text} - Distance: ${(inst.distance / 1000).toFixed(2)} km`)
  })

  return instructions
}

module.exports = generateInstructions
