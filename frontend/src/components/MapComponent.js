"use client"

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents } from "react-leaflet";
import MapUpdater from "./MapUpdater";
import MapResizeHandler from "./MapResizeHandler";
import DirectionMarker from "./DirectionMarker";
import { bluePinIcon, redPinIcon } from "../utils/iconUtils";
import { riskColors } from "../utils/riskUtils";
import "../components/DirectionMarker.css";
import L from "leaflet";

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

const MapComponent = React.forwardRef((props, ref) => {
  const {
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
    onMapClick,
    isPinMode,
  } = props;

  const [remainingPath, setRemainingPath] = useState([]);
  const internalMapRef = useRef(null);
  const mapRef = ref || internalMapRef;
  const truckMarkerRef = useRef(null);

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

  useEffect(() => {
    if (mapRef.current && currentLocation) {
      if (truckMarkerRef.current) {
        mapRef.current.removeLayer(truckMarkerRef.current);
        truckMarkerRef.current = null;
      }
    }
  }, [currentLocation, mapRef]);

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
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      ref={ref}
      whenCreated={(map) => {
        if (ref) {
          if (typeof ref === 'function') {
            ref(map);
          } else if (ref.hasOwnProperty('current')) {
            ref.current = map;
          }
        }
        if (internalMapRef) internalMapRef.current = map;
      }}
    >
      <MapEvents onMapClick={onMapClick} isPinMode={isPinMode} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater center={mapCenter} zoom={13} />
      <MapResizeHandler />

      {currentLocation && !isMonitoring && !isSimulation && (
        <Marker position={currentLocation} icon={bluePinIcon}>
          <Popup>Votre position actuelle</Popup>
        </Marker>
      )}

      {currentLocation && (isMonitoring || isSimulation) && (
        <DirectionMarker
          position={currentLocation}
          heading={heading}
          routeGeometry={routeGeometry}
          isMonitoring={isMonitoring}
          isSimulation={isSimulation}
        />
      )}

      {positionArrivee && (
        <Marker position={positionArrivee} icon={redPinIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {/* Afficher le chemin avec animation de flèches */}
      {routeGeometry && routeGeometry.length > 0 && (
        <>
          {/* Ligne de base du trajet */}
          <Polyline
            positions={isMonitoring || isSimulation ? remainingPath : routeGeometry}
            color={"#4285F4"} // Bleu Google Maps
            weight={5}
            opacity={0.9}
            className="animated-route"
          />
          
          {/* Animation des flèches le long du trajet */}
          {Array.from({ length: 10 }).map((_, i) => {
            // Calculer la position de chaque flèche le long du trajet
            const path = isMonitoring || isSimulation ? remainingPath : routeGeometry;
            const segmentLength = path.length / 10;
            const startIdx = Math.floor(i * segmentLength);
            const endIdx = Math.min(Math.ceil((i + 1) * segmentLength), path.length - 1);
            
            if (startIdx >= endIdx) return null;
            
            const arrowPath = path.slice(startIdx, endIdx + 1);
            
            return (
              <Polyline
                key={`arrow-${i}`}
                positions={arrowPath}
                color={"#4285F4"}
                weight={5}
                opacity={0}
                dashArray="20, 30"
                className="animated-arrow"
                style={{
                  animation: `dash 1s linear ${i * 0.5}s infinite`,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              />
            );
          })}
        </>
      )}

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

      {isPinMode && (
        <>
          <div style={{ 
            position: 'fixed', 
            bottom: '70px',
            left: '50%',
            transform: 'translateX(calc(-50% + 20px))',
            zIndex: 1000,
            textAlign: 'center',
            maxWidth: '90%',
            padding: '10px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '25px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            animation: 'pulse 2s infinite',
            whiteSpace: 'nowrap'
          }}>
            Cliquez sur la carte pour placer votre destination
          </div>
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            textAlign: 'center'
          }}>
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Désactive immédiatement le mode pin AVANT le click sur la carte
                if (typeof window !== "undefined") {
                  const event = new CustomEvent('cancelPinMode');
                  window.dispatchEvent(event);
                }
              }}
              className="cancel-pin-button"
              style={{
                width: 'auto',
                minWidth: '120px',
                padding: '10px 30px'
              }}
            >
              Annuler
            </button>
          </div>
        </>
      )}
    </MapContainer>
  )
})

MapComponent.displayName = 'MapComponent';

export default MapComponent
