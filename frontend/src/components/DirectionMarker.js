"use client"

import { useEffect, useState, useRef } from "react"
import { Marker, useMap } from "react-leaflet"
import { createTruckIcon } from "./TruckIcon"
import L from "leaflet"
import "./DirectionMarker.css"

const DirectionMarker = ({ position, heading, routeGeometry, isMonitoring, isSimulation = false }) => {
  const [truckIcon, setTruckIcon] = useState(null)
  const [isMoving, setIsMoving] = useState(false)
  const map = useMap()
  const lastPositionRef = useRef(null)
  const pathRef = useRef(null)
  const lastUpdateTime = useRef(Date.now())

  useEffect(() => {
    if (position) {
      // Détecter si le camion bouge
      const now = Date.now()
      const timeDiff = now - lastUpdateTime.current

      if (lastPositionRef.current && timeDiff > 0) {
        const distance = L.latLng(lastPositionRef.current).distanceTo(L.latLng(position))
        const speed = distance / (timeDiff / 1000) // mètres par seconde
        setIsMoving(speed > 0.1) // Considérer comme en mouvement si > 0.1 m/s
      }

      // 🚛 Utiliser l'icône de camion améliorée
      const icon = createTruckIcon(heading || 0, isMoving)
      setTruckIcon(icon)

      // Centrer la carte sur la position actuelle
      if ((isMonitoring || isSimulation) && map) {
        map.panTo(position)
      }

      // Mettre à jour le chemin parcouru
      if ((isMonitoring || isSimulation) && routeGeometry && routeGeometry.length > 0) {
        if (
          !lastPositionRef.current ||
          lastPositionRef.current[0] !== position[0] ||
          lastPositionRef.current[1] !== position[1]
        ) {
          lastPositionRef.current = position
          lastUpdateTime.current = now

          // Créer ou mettre à jour le chemin parcouru avec de meilleures couleurs
          if (!pathRef.current) {
            pathRef.current = L.polyline([position], {
              color: isSimulation ? "#9333ea" : "#00d4aa", // Violet pour simulation, turquoise pour réel
              weight: 6,
              opacity: 0.9,
              dashArray: isSimulation ? "15, 10" : "none",
              className: "traveled-path",
            }).addTo(map)
          } else {
            pathRef.current.addLatLng(position)

            // Limiter le chemin parcouru aux 30 derniers points
            if (pathRef.current.getLatLngs().length > 30) {
              const points = pathRef.current.getLatLngs()
              pathRef.current.setLatLngs(points.slice(points.length - 30))
            }
          }
        }
      }
    }
  }, [position, heading, map, isMonitoring, isSimulation, routeGeometry, isMoving])

  // Nettoyer le chemin parcouru quand le composant est démonté
  useEffect(() => {
    return () => {
      if (pathRef.current) {
        map.removeLayer(pathRef.current)
      }
    }
  }, [map])

  if (!position || !truckIcon) return null

  return <Marker position={position} icon={truckIcon} zIndexOffset={1000} />
}

export default DirectionMarker
