"use client"

import { useState, useEffect, useCallback } from "react"
import isPointInPolygon from "../utils/isPointInPolygon"

const useZoneAlerts = (currentLocation, zones, queueSpeech, isMonitoring) => {
  const [currentZone, setCurrentZone] = useState(null)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertTimeout, setAlertTimeout] = useState(null)
  const [lastAlertTime, setLastAlertTime] = useState(0)
  const [lastZoneId, setLastZoneId] = useState(null)
  const [upcomingZones, setUpcomingZones] = useState([])
  const [alertType, setAlertType] = useState("warning") // "danger", "caution", "warning"

  // Fonction pour vérifier si un point est dans une zone
  const checkZone = useCallback(
    (lat, lon) => {
      if (!lat || !lon || !zones || zones.length === 0) return null

      const point = { lat, lon }

      for (const zone of zones) {
        if (isPointInPolygon(point, zone.geometry)) {
          return zone
        }
      }

      return null
    },
    [zones],
  )

  // Fonction pour calculer la distance entre deux points
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  // Fonction pour calculer le centre de gravité d'une zone
  const getZoneCenter = useCallback((geometry) => {
    if (!geometry || geometry.length === 0) return null

    let totalLat = 0,
      totalLon = 0
    for (const point of geometry) {
      totalLat += point.lat
      totalLon += point.lon
    }

    return {
      lat: totalLat / geometry.length,
      lon: totalLon / geometry.length,
    }
  }, [])

  // Fonction pour déclencher une alerte
  const triggerAlert = useCallback(
    (type, message, zone, distance) => {
      // Éviter les alertes répétitives
      const now = Date.now()
      if (lastZoneId === zone?.zoneId && now - lastAlertTime < 30000) {
        return
      }

      setAlertType(type)
      setAlertMessage(message)
      setShowAlert(true)
      setLastZoneId(zone?.zoneId)
      setLastAlertTime(now)

      // Notification sonore
      queueSpeech(message)

      // Auto-hide après 5 secondes pour les alertes danger/caution, 3 secondes pour warning
      const hideDelay = type === "danger" ? 6000 : type === "caution" ? 4000 : 3000

      if (alertTimeout) {
        clearTimeout(alertTimeout)
      }

      const timeout = setTimeout(() => {
        setShowAlert(false)
      }, hideDelay)

      setAlertTimeout(timeout)
    },
    [lastZoneId, lastAlertTime, alertTimeout, queueSpeech],
  )

  // Effet principal pour détecter les zones et alertes
  useEffect(() => {
    if (!isMonitoring || !currentLocation || !Array.isArray(currentLocation) || currentLocation.length !== 2) {
      setUpcomingZones([])
      return
    }

    const [lat, lon] = currentLocation
    const detectedZone = checkZone(lat, lon)
    const upcoming = []

    // Vérifier les zones à proximité pour les alertes préventives
    zones.forEach((zone) => {
      const center = getZoneCenter(zone.geometry)
      if (!center) return

      const distance = calculateDistance(lat, lon, center.lat, center.lon)
      const risk = zone.risk?.toLowerCase()

      // Zone proche (dans les 200m) - Alerte préventive
      if (distance <= 200 && distance > 50 && risk === "élevé") {
        upcoming.push({
          ...zone,
          distance,
          alertType: "warning",
        })

        // Alerte préventive pour zone à risque élevé
        if (!lastZoneId || lastZoneId !== zone.zoneId) {
          triggerAlert("warning", `Zone à risque élevé à ${Math.round(distance)}m`, zone, distance)
        }
      }

      // Zone très proche (dans les 50m) - Alerte immédiate
      if (distance <= 50 && (risk === "élevé" || risk === "moyen")) {
        const alertTypeImmediate = risk === "élevé" ? "danger" : "caution"
        triggerAlert(alertTypeImmediate, `Attention ! Zone à risque ${risk} à ${Math.round(distance)}m`, zone, distance)
      }
    })

    setUpcomingZones(upcoming)

    // Si nous sommes dans une zone à risque
    if (detectedZone) {
      const normalizedRisk = detectedZone.risk?.toLowerCase() || "inconnu"

      // Alerter pour les zones à risque élevé
      if (normalizedRisk === "élevé") {
        if (!currentZone || detectedZone.zoneId !== lastZoneId) {
          triggerAlert("danger", `Vous êtes dans une zone à risque élevé !`, detectedZone, 0)
        } else {
          // Rappel périodique pour les zones à risque élevé
          const now = Date.now()
          if (now - lastAlertTime > 30000) {
            triggerAlert("danger", `Attention ! Toujours dans une zone à risque élevé`, detectedZone, 0)
          }
        }
      }
      // Alerter pour les zones à risque moyen (moins fréquent)
      else if (normalizedRisk === "moyen") {
        if (!currentZone || detectedZone.zoneId !== lastZoneId) {
          triggerAlert("caution", `Zone à risque moyen - Soyez prudent`, detectedZone, 0)
        }
      }
    }

    setCurrentZone(detectedZone)

    return () => {
      if (alertTimeout) {
        clearTimeout(alertTimeout)
      }
    }
  }, [
    currentLocation,
    zones,
    currentZone,
    checkZone,
    calculateDistance,
    getZoneCenter,
    triggerAlert,
    isMonitoring,
    lastZoneId,
    lastAlertTime,
    alertTimeout,
  ])

  return {
    showAlert,
    alertMessage,
    alertType,
    currentZone,
    upcomingZones,
    setShowAlert, // Pour permettre de fermer manuellement l'alerte
  }
}

export default useZoneAlerts
