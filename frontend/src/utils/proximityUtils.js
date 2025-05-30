import L from "leaflet"

const checkProximity = (currentLocation, routeInstructions, isSpeaking, queueSpeech, isMonitoring) => {
  // Ne vérifier la proximité que si la navigation est active
  if (!isMonitoring || !currentLocation || routeInstructions.length === 0) return

  // Trouver la prochaine instruction non encore déclenchée
  const nextInstruction = routeInstructions.find((instr) => {
    if (instr.triggered) return false // Ignorer les instructions déjà déclenchées
    const distance = L.latLng(currentLocation).distanceTo(instr.point)
    return distance > 10 && distance < 100 // Entre 10m et 100m
  })

  if (nextInstruction) {
    const distance = L.latLng(currentLocation).distanceTo(nextInstruction.point)
    console.log(
      `checkProximity - Position actuelle: ${currentLocation}, Prochain point: [${nextInstruction.point.lat}, ${nextInstruction.point.lng}], Distance: ${distance.toFixed(2)}m, Instruction: "${nextInstruction.text}", isSpeaking: ${isSpeaking}`,
    )

    // Déclencher l'instruction à 50m
    if (distance < 50 && distance > 10 && !isSpeaking) {
      console.log(`🔊 Déclenchement instruction: ${nextInstruction.text}`)
      queueSpeech(nextInstruction.text)

      // Marquer l'instruction comme déclenchée pour éviter la répétition
      nextInstruction.triggered = true
    }
  }
}

export { checkProximity }
