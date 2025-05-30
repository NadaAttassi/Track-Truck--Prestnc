"use client"

import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents } from "react-leaflet"
import MapUpdater from "./MapUpdater"
import MapResizeHandler from "./MapResizeHandler"
import DirectionMarker from "./DirectionMarker"
import { orangePinIcon, redPinIcon } from "../utils/iconUtils"
import { riskColors } from "../utils/riskUtils"
import "../components/DirectionMarker.css"
import { useEffect, useState } from "react"

// Composant pour gérer les événements de la carte
const MapEvents = ({ onMapClick, isPinMode }) => {
  useMapEvents({
    click: (e) => {
      if (isPinMode) {
        onMapClick(e)
      }
    },
  })
  return null
}

const MapComponent = ({
  mapCenter,
  currentLocation,
  positionArrivee,
  routeGeometry,
  selectedRouteIndex,
  safePathIndex,
  showZones,
  zones,
  heading,
  isMonitoring,
  isSimulation,
  traveledPath,
  onMapClick,
  isPinMode,
}) => {
  const [remainingPath, setRemainingPath] = useState([])

  // Diviser l'itinéraire en chemin parcouru et chemin restant
  useEffect(() => {
    if (!routeGeometry || routeGeometry.length === 0 || !currentLocation || (!isMonitoring && !isSimulation)) {
      setRemainingPath(routeGeometry || [])
      return
    }

    // Trouver le point le plus proche sur l'itinéraire
    let closestPointIndex = 0
    let minDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < routeGeometry.length; i++) {
      const point = routeGeometry[i]
      const distance = calculateDistance(currentLocation[0], currentLocation[1], point[0], point[1])

      if (distance < minDistance) {
        minDistance = distance
        closestPointIndex = i
      }
    }

    // Diviser l'itinéraire
    const remaining = routeGeometry.slice(closestPointIndex)
    setRemainingPath(remaining)
  }, [routeGeometry, currentLocation, isMonitoring, isSimulation])

  // Fonction pour calculer la distance entre deux points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <MapEvents onMapClick={onMapClick} isPinMode={isPinMode} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater center={mapCenter} zoom={13} />
      <MapResizeHandler />

      {currentLocation && (
        <>
          {/* Marqueur de position standard (masqué si la flèche directionnelle est active) */}
          {heading === null && !isMonitoring && !isSimulation && (
            <Marker position={currentLocation} icon={orangePinIcon}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
          )}

          {/* Camion directionnel */}
          {(heading !== null || isMonitoring || isSimulation) && (
            <DirectionMarker
              position={currentLocation}
              heading={heading}
              routeGeometry={routeGeometry}
              isMonitoring={isMonitoring}
              isSimulation={isSimulation}
            />
          )}
        </>
      )}

      {positionArrivee && (
        <Marker position={positionArrivee} icon={redPinIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {/* Afficher le chemin restant avec de meilleures couleurs et animations */}
      {routeGeometry &&
        routeGeometry.length > 0 &&
        ((isMonitoring || isSimulation) && remainingPath.length > 0 ? (
          <Polyline
            positions={remainingPath}
            color={safePathIndex === selectedRouteIndex ? "#8b5cf6" : "#3b82f6"} // Violet pour safe path, bleu pour normal
            weight={5}
            opacity={0.8}
            dashArray="10, 5"
            className="remaining-path"
          />
        ) : (
          <Polyline
            positions={routeGeometry}
            color={safePathIndex === selectedRouteIndex ? "#8b5cf6" : "#3b82f6"}
            weight={5}
            opacity={0.8}
            className="remaining-path"
          />
        ))}

      {showZones &&
        zones.map((zone, index) => {
          const normalizedRisk = zone.risk?.toLowerCase() || "inconnu"
          const fillOpacity = normalizedRisk === "élevé" ? 0.5 : normalizedRisk === "moyen" ? 0.4 : 0.3
          const weight = normalizedRisk === "élevé" ? 3 : 2

          return (
            <Polygon
              key={index}
              positions={zone.geometry.map((coord) => [coord.lat, coord.lon])}
              pathOptions={{
                color: riskColors[normalizedRisk] || "gray",
                fillColor: riskColors[normalizedRisk] || "gray",
                fillOpacity: fillOpacity,
                weight: weight,
              }}
            >
              <Popup>
                <strong>Zone: {zone.zoneId}</strong> <br />
                <span style={{ color: riskColors[normalizedRisk] }}>Risque: {zone.risk || "Inconnu"}</span> <br />
                Type: {zone.tags.landuse || "Inconnu"}
              </Popup>
            </Polygon>
          )
        })}

      {isPinMode && <div className="pin-mode-indicator">Cliquez sur la carte pour placer votre destination</div>}
    </MapContainer>
  )
}

export default MapComponent
