"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import * as turf from "@turf/turf"

const useMonitoring = (
  currentLocation,
  positionArrivee,
  routes,
  selectedRouteIndex,
  fetchRouteFromServer,
  setRoutes,
  setRouteInstructions,
  setRouteGeometry,
  setRemainingDistance,
  setRemainingTime,
  setError,
  setLoading,
  setSelectedRouteIndex,
  setShowInstructions,
  setShowRouteInfo,
  queueSpeech,
  setCurrentLocation,
) => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [navigationStarted, setNavigationStarted] = useState(false)
  const [deviationMessage, setDeviationMessage] = useState(null)
  const [lastCheckTime, setLastCheckTime] = useState(0)

  // 🚛 ÉTATS POUR LA SIMULATION AMÉLIORÉS
  const [isSimulationMode, setIsSimulationMode] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [simulationSpeed, setSimulationSpeed] = useState(2) // Vitesse par défaut plus stable
  const simulationIntervalRef = useRef(null)
  const currentIndexRef = useRef(0)
  const isSimulationActiveRef = useRef(false)

  const checkDeviation = useCallback(() => {
    if (
      !isMonitoring ||
      !currentLocation ||
      !routes[selectedRouteIndex] ||
      !routes[selectedRouteIndex].geometry ||
      isSimulationMode
    ) {
      return
    }

    const now = Date.now()
    if (now - lastCheckTime < 5000) {
      return
    }
    setLastCheckTime(now)

    const geometry = routes[selectedRouteIndex].geometry
    const currentPoint = turf.point([currentLocation[1], currentLocation[0]])
    const line = turf.lineString(geometry.map((coord) => [coord[1], coord[0]]))
    const nearestPoint = turf.nearestPointOnLine(line, currentPoint, { units: "meters" })
    const minDistance = nearestPoint.properties.dist

    console.log("Distance minimale à l'itinéraire:", minDistance.toFixed(2), "mètres")

    if (minDistance > 1000) {
      setDeviationMessage("Vous vous êtes écarté de l'itinéraire. Recalcul en cours...")
      queueSpeech("Vous vous êtes écarté de l'itinéraire. Recalcul en cours.")
      recalculateRoutes()
    } else {
      setDeviationMessage(null)
    }
  }, [isMonitoring, currentLocation, routes, selectedRouteIndex, queueSpeech, lastCheckTime, isSimulationMode])

  const recalculateRoutes = async () => {
    if (!currentLocation || !positionArrivee) {
      setError("Impossible de recalculer l'itinéraire : position ou destination manquante.")
      return
    }

    setLoading(true)
    await fetchRouteFromServer(
      currentLocation,
      positionArrivee,
      setRoutes,
      setRouteInstructions,
      setRouteGeometry,
      setRemainingDistance,
      setRemainingTime,
      setError,
      setLoading,
      setSelectedRouteIndex,
      setShowInstructions,
    )
    setShowRouteInfo(true)
    setShowInstructions(false)
  }

  // 🚛 FONCTION DE SIMULATION AMÉLIORÉE ET PLUS FIABLE
  const startSimulation = useCallback(() => {
    if (!routes[selectedRouteIndex] || !routes[selectedRouteIndex].geometry) {
      setError("Aucun itinéraire sélectionné pour la simulation.")
      return
    }

    console.log("🚛 Démarrage de la simulation...")

    // Arrêter toute simulation précédente
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
    }

    setIsSimulationMode(true)
    setIsMonitoring(true)
    setNavigationStarted(true)
    setSimulationProgress(0)
    setDeviationMessage(null)
    currentIndexRef.current = 0
    isSimulationActiveRef.current = true

    queueSpeech("Simulation de navigation démarrée.")

    const geometry = routes[selectedRouteIndex].geometry

    // Démarrer la position au début de l'itinéraire
    if (geometry.length > 0) {
      setCurrentLocation([geometry[0][0], geometry[0][1]])
    }

    // Fonction de simulation avec gestion d'erreurs
    const simulateMovement = () => {
      if (!isSimulationActiveRef.current || !geometry || geometry.length === 0) {
        return
      }

      const currentIndex = currentIndexRef.current

      if (currentIndex < geometry.length - 1) {
        // Calculer le prochain index basé sur la vitesse
        const nextIndex = Math.min(currentIndex + simulationSpeed, geometry.length - 1)
        currentIndexRef.current = nextIndex

        const newPosition = [geometry[nextIndex][0], geometry[nextIndex][1]]
        setCurrentLocation(newPosition)

        const progress = (nextIndex / (geometry.length - 1)) * 100
        setSimulationProgress(progress)

        console.log(
          `🚛 Simulation: ${progress.toFixed(1)}% - Index: ${nextIndex}/${geometry.length - 1} - Position: [${newPosition[0].toFixed(6)}, ${newPosition[1].toFixed(6)}]`,
        )

        // Vérifier si on a atteint la destination
        if (nextIndex >= geometry.length - 1) {
          console.log("🏁 Simulation terminée - Arrivée à destination")
          queueSpeech("Simulation terminée. Vous êtes arrivé à destination.")
          stopSimulation()
        }
      }
    }

    // Démarrer l'intervalle avec une fréquence fixe
    simulationIntervalRef.current = setInterval(simulateMovement, 500) // 500ms pour plus de fluidité
  }, [routes, selectedRouteIndex, simulationSpeed, setCurrentLocation, setError, queueSpeech])

  // 🚛 FONCTION D'ARRÊT AMÉLIORÉE
  const stopSimulation = useCallback(() => {
    console.log("🛑 Arrêt de la simulation")

    isSimulationActiveRef.current = false
    setIsSimulationMode(false)
    setIsMonitoring(false)
    setNavigationStarted(false)
    setSimulationProgress(0)
    setDeviationMessage(null)
    currentIndexRef.current = 0

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }

    queueSpeech("Simulation arrêtée.")
  }, [queueSpeech])

  // 🚛 FONCTION POUR CHANGER LA VITESSE EN TEMPS RÉEL
  const updateSimulationSpeed = useCallback(
    (newSpeed) => {
      console.log(`🚛 Changement de vitesse: ${simulationSpeed}x -> ${newSpeed}x`)
      setSimulationSpeed(newSpeed)

      // Pas besoin de redémarrer l'intervalle, la nouvelle vitesse sera prise en compte au prochain cycle
    },
    [simulationSpeed],
  )

  const startMonitoring = () => {
    if (!currentLocation || !positionArrivee || routes.length === 0) {
      setError("Veuillez sélectionner un point de départ et une destination, puis calculer un itinéraire.")
      return
    }
    setIsMonitoring(true)
    setNavigationStarted(true)
    setDeviationMessage(null)
    console.log("Monitoring démarré...")
    queueSpeech("Navigation démarrée.")
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    setNavigationStarted(false)
    setDeviationMessage(null)

    // Arrêter aussi la simulation si elle est active
    if (isSimulationMode) {
      stopSimulation()
    }

    console.log("Monitoring arrêté.")
    queueSpeech("Navigation arrêtée.")
  }

  // Effect for monitoring (isolated within the hook)
  useEffect(() => {
    let intervalId

    if (isMonitoring && !isSimulationMode) {
      intervalId = setInterval(() => {
        checkDeviation()
      }, 1000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isMonitoring, isSimulationMode, checkDeviation])

  // Nettoyer l'intervalle de simulation au démontage
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
      isSimulationActiveRef.current = false
    }
  }, [])

  return {
    isMonitoring,
    navigationStarted,
    deviationMessage,
    startMonitoring,
    stopMonitoring,
    // 🚛 FONCTIONS ET ÉTATS POUR LA SIMULATION
    isSimulationMode,
    simulationProgress,
    simulationSpeed,
    setSimulationSpeed: updateSimulationSpeed, // Utiliser la fonction améliorée
    startSimulation,
    stopSimulation,
  }
}

export default useMonitoring
