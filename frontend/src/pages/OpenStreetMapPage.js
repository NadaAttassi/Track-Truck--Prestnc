"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { debounce } from "lodash";
import ErrorBoundary from "../components/ErrorBoundary";
import MapComponent from "../components/MapComponent";
import SearchBar from "../components/SearchBar";
import PlaceDetails from "../components/PlaceDetails";
import RouteInfo from "../components/RouteInfo";
import RouteAnalysis from "../components/RouteAnalysis";
import ManualLocationForm from "../components/ManualLocationForm";
import useSpeechQueue from "../hooks/useSpeechQueue";
import useGeolocation from "../hooks/useGeolocation";
import useSuggestions from "../hooks/useSuggestions";
import useRiskAnalysis from "../hooks/useRiskAnalysis";
import useRoute from "../hooks/useRoute";
import useZones from "../hooks/useZones";
import useMonitoring from "../hooks/useMonitoring";
import useDeviceOrientation from "../hooks/useDeviceOrientation";
import useZoneAlerts from "../hooks/useZoneAlerts";
import { checkProximity } from "../utils/proximityUtils";
import "./OpenStreetMapPage.css";

const OpenStreetMapPage = () => {
  const [error, setError] = useState(null);
  const { currentLocation, setCurrentLocation, isLoadingLocation } = useGeolocation(setError);
  const { searchQuery, setSearchQuery, suggestions, setSuggestions, fetchSuggestions } = useSuggestions(setError);
  const { queueSpeech, isSpeaking } = useSpeechQueue();
  const { riskAnalysis, setRiskAnalysis, safePathIndex, setSafePathIndex, fetchRiskAnalysis } = useRiskAnalysis();
  const { zones, showZones, handleShowZonesClick } = useZones(setError);
  const { fetchRouteFromServer } = useRoute(fetchRiskAnalysis, zones, setError);
  const { heading, speed } = useDeviceOrientation();

  const [positionArrivee, setPositionArrivee] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeInstructions, setRouteInstructions] = useState([]);
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [manualLocation, setManualLocation] = useState({ lat: "", lon: "" });
  const [placeDetails, setPlaceDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(true);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [expandedCard, setExpandedCard] = useState("none");
  const [traveledPath, setTraveledPath] = useState([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isPinMode, setIsPinMode] = useState(false);
  const [pinPosition, setPinPosition] = useState(null);
  const [showRouteAnalysis, setShowRouteAnalysis] = useState(false);

  const {
    isMonitoring,
    deviationMessage,
    startMonitoring,
    stopMonitoring,
    isSimulationMode,
    simulationProgress,
    simulationSpeed,
    setSimulationSpeed,
    startSimulation,
    stopSimulation,
  } = useMonitoring(
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
  );

  const findClosestPointOnRoute = useCallback(() => {
    if (!currentLocation || !routeGeometry || routeGeometry.length === 0 || !isMonitoring) return null;

    let closestPoint = null;
    let minDistance = Number.POSITIVE_INFINITY;
    let closestIndex = 0;

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    for (let i = 0; i < routeGeometry.length; i++) {
      const point = routeGeometry[i];
      const distance = calculateDistance(currentLocation[0], currentLocation[1], point[0], point[1]);

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
        closestIndex = i;
      }
    }

    if (closestIndex >= 0) {
      const newTraveledPath = routeGeometry.slice(0, closestIndex + 1);
      setTraveledPath(newTraveledPath);
    }

    return { point: closestPoint, index: closestIndex };
  }, [currentLocation, routeGeometry, isMonitoring]);

  useEffect(() => {
    if (isMonitoring) {
      findClosestPointOnRoute();
    }
  }, [currentLocation, isMonitoring, findClosestPointOnRoute]);

  const { showAlert, alertMessage, alertType, upcomingZones } = useZoneAlerts(
    currentLocation,
    zones,
    queueSpeech,
    isMonitoring,
  );

  const mapCenter = positionArrivee || currentLocation || [33.5731, -7.5898];

  const toggleCard = (card) => {
    console.log("🔄 Toggle card:", card, "current:", expandedCard);
    if (expandedCard === card) {
      setExpandedCard("none");
    } else {
      setExpandedCard(card);
    }
  };

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedFetchSuggestions(query);
  };

  const handleSelectSuggestion = useCallback(
    async (suggestion) => {
      const lat = Number.parseFloat(suggestion.lat);
      const lon = Number.parseFloat(suggestion.lon);
      if (isNaN(lat) || isNaN(lon)) {
        setError("Coordonnées de la destination invalides. Veuillez sélectionner une autre destination.");
        return;
      }
      const newPosition = [lat, lon];
      setPositionArrivee(newPosition);
      setPlaceDetails({
        name: suggestion.name,
        type: suggestion.type || "Lieu",
        city: suggestion.city || "Ville inconnue",
        lat: suggestion.lat,
        lon: suggestion.lon,
      });
      setShowDetails(true);
      setSearchQuery(`${suggestion.name}, ${suggestion.city}`);
      setSuggestions([]);
      console.log("PositionArrivee définie:", newPosition);
      setError(null);
      setRoutes([]);
      setRouteInstructions([]);
      setRouteGeometry([]);
      setRemainingDistance(0);
      setRemainingTime(0);
      setShowRouteInfo(false);
      setShowInstructions(false);
      setSelectedRouteIndex(0);
    },
    [setError, setSearchQuery, setSuggestions],
  );

  const handleDirectionsClick = useCallback(() => {
    console.log("🎯 handleDirectionsClick - État actuel:", { showRouteInfo, routesLength: routes.length });

    if (showRouteInfo) {
      setShowRouteInfo(false);
      setShowInstructions(false);
      setExpandedCard("place");
    } else if (routes.length > 0) {
      console.log("✅ Affichage des routes existantes");
      setShowRouteInfo(true);
      setExpandedCard("route");
      setShowInstructions(false);
    } else {
      console.log("🔄 Calcul de nouveaux itinéraires");
      console.log("handleDirectionsClick - currentLocation:", currentLocation, "positionArrivee:", positionArrivee);

      if (
        !currentLocation ||
        !Array.isArray(currentLocation) ||
        currentLocation.length !== 2 ||
        isNaN(currentLocation[0]) ||
        isNaN(currentLocation[1])
      ) {
        setError(
          "Position de départ non définie. Veuillez activer la géolocalisation ou entrer une position manuellement.",
        );
        return;
      }
      if (
        !positionArrivee ||
        !Array.isArray(positionArrivee) ||
        positionArrivee.length !== 2 ||
        isNaN(positionArrivee[0]) ||
        isNaN(positionArrivee[1])
      ) {
        setError("Position d'arrivée non définie. Veuillez sélectionner une destination.");
        return;
      }

      setIsCalculatingRoute(true);
      fetchRouteFromServer(
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
        setRiskAnalysis,
        setSafePathIndex,
        setShowRouteInfo,
      ).finally(() => {
        setIsCalculatingRoute(false);
        setShowRouteInfo(true);
        setExpandedCard("route");
      });
    }
  }, [
    showRouteInfo,
    routes,
    currentLocation,
    positionArrivee,
    fetchRouteFromServer,
    setError,
    setRiskAnalysis,
    setSafePathIndex,
  ]);

  const handleRouteSelectFromAnalysis = useCallback(
    (routeIndex) => {
      console.log(`🔄 Sélection route ${routeIndex + 1} depuis l'analyse`);
      setSelectedRouteIndex(routeIndex);
      const selectedRoute = routes[routeIndex];
      setRouteGeometry(selectedRoute.geometry);
      setRouteInstructions(selectedRoute.instructions);
      setRemainingDistance(selectedRoute.distance);
      setRemainingTime(selectedRoute.duration);
      setShowInstructions(false);
    },
    [routes],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      checkProximity(currentLocation, routeInstructions, isSpeaking, queueSpeech, isMonitoring);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentLocation, routeInstructions, isSpeaking, queueSpeech, isMonitoring]);

  const handleManualLocationSubmit = (e) => {
    e.preventDefault();
    const lat = Number.parseFloat(manualLocation.lat);
    const lon = Number.parseFloat(manualLocation.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      setCurrentLocation([lat, lon]);
      setError(null);
    } else {
      setError("Coordonnées invalides.");
    }
  };

  const handlePlacePin = useCallback(() => {
    setIsPinMode(true);
    setSuggestions([]);
    setSearchQuery("");
  }, []);

  const handleMapClick = useCallback(
    (e) => {
      if (isPinMode) {
        const { lat, lng } = e.latlng;
        console.log("Pin placé à:", lat, lng);
        setPinPosition([lat, lng]);
        setPositionArrivee([lat, lng]);
        setPlaceDetails({
          name: "Destination personnalisée",
          type: "Point personnalisé",
          city: "Position sélectionnée",
          lat: lat.toString(),
          lon: lng.toString(),
        });
        setShowDetails(true);
        setIsPinMode(false);
        setError(null);

        setRoutes([]);
        setRouteInstructions([]);
        setRouteGeometry([]);
        setRemainingDistance(0);
        setRemainingTime(0);
        setShowRouteInfo(false);
        setShowInstructions(false);
        setSelectedRouteIndex(0);
      }
    },
    [isPinMode],
  );

  const handleShowAnalysis = useCallback(() => {
    console.log("📊 Ouverture de l'analyse via le bouton Analyse");
    setShowRouteAnalysis(true);
  }, []);

  const renderAlert = () => {
    if (!showAlert) return null;

    const getAlertStyle = () => {
      switch (alertType) {
        case "danger":
          return {
            backgroundColor: "rgba(220, 53, 69, 0.9)",
            color: "white",
            border: "3px solid #a71e2a",
            animation: "pulse 1s infinite",
          };
        case "caution":
          return {
            backgroundColor: "rgba(255, 193, 7, 0.9)",
            color: "#333",
            border: "3px solid #d39e00",
          };
        default:
          return {
            backgroundColor: "rgba(23, 162, 184, 0.9)",
            color: "white",
            border: "3px solid #117a8b",
          };
      }
    };

    return (
      <div
        className="risk-zone-alert"
        style={{
          ...getAlertStyle(),
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 3000,
          padding: "15px 25px",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
        }}
      >
        <i className="fas fa-exclamation-triangle"></i>
        {alertMessage}
      </div>
    );
  };

  const renderUpcomingZones = () => {
    if (!upcomingZones || upcomingZones.length === 0) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: "80px",
          right: "20px",
          zIndex: 2500,
        }}
      >
        {upcomingZones.slice(0, 3).map((zone, index) => (
          <div
            key={zone.zoneId || index}
            style={{
              backgroundColor: "rgba(255, 193, 7, 0.9)",
              color: "#333",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              marginBottom: "5px",
              border: "1px solid #ffc107",
              backdropFilter: "blur(5px)",
            }}
          >
            <div style={{ fontWeight: "bold" }}>⚠️ Zone à risque à {Math.round(zone.distance)}m</div>
            <div style={{ fontSize: "10px", opacity: 0.8 }}>{zone.zoneId}</div>
          </div>
        ))}
      </div>
    );
  };

  // Ajout de la logique pour la synthèse vocale
  const lastInstructionIndexRef = useRef(-1);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (
      isMonitoring &&
      routeInstructions.length > 0 &&
      routeGeometry.length > 0 &&
      currentLocation
    ) {
      const closest = findClosestPointOnRoute();
      if (!closest) return;

      const { point: closestPoint } = closest;

      // Trouver l'instruction la plus proche en comparant les coordonnées
      let closestInstructionIndex = -1;
      let minDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < routeInstructions.length; i++) {
        const instruction = routeInstructions[i];
        const instructionPoint = instruction.point;
        const distance = calculateDistance(
          currentLocation[0],
          currentLocation[1],
          instructionPoint[0],
          instructionPoint[1]
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestInstructionIndex = i;
        }
      }

      // Si une instruction est trouvée et qu'elle est différente de la dernière lue
      if (
        closestInstructionIndex !== -1 &&
        closestInstructionIndex !== lastInstructionIndexRef.current
      ) {
        const instruction = routeInstructions[closestInstructionIndex];
        const textToSpeak = instruction.text || "Prochaine étape";
        queueSpeech(textToSpeak);
        lastInstructionIndexRef.current = closestInstructionIndex;
      }
    }
  }, [currentLocation, isMonitoring, routeInstructions, routeGeometry, queueSpeech, findClosestPointOnRoute]);

  useEffect(() => {
    if (!isMonitoring) {
      setTraveledPath([]);
      lastInstructionIndexRef.current = -1; // Réinitialiser l'index de l'instruction
    }
  }, [isMonitoring]);

  return (
    <ErrorBoundary>
      <div className={`open-street-map-page ${isPinMode ? "map-pin-mode" : ""}`}>
        <div className="map-container">
          <MapComponent
            mapCenter={mapCenter}
            currentLocation={currentLocation}
            positionArrivee={positionArrivee}
            routeGeometry={routeGeometry}
            selectedRouteIndex={selectedRouteIndex}
            safePathIndex={safePathIndex}
            showZones={showZones}
            zones={zones}
            heading={speed > 1 ? heading : null}
            isMonitoring={isMonitoring}
            traveledPath={traveledPath}
            onMapClick={handleMapClick}
            isPinMode={isPinMode}
          />
          {isLoadingLocation && !currentLocation && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Récupération de votre position en cours...</p>
            </div>
          )}
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>En train de chercher l'itinéraire...</p>
            </div>
          )}
          <SearchBar
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            suggestions={suggestions}
            handleSelectSuggestion={handleSelectSuggestion}
            currentLocation={currentLocation}
            handlePlacePin={handlePlacePin}
          />
          <div className="show-zones-button">
            <button onClick={handleShowZonesClick} className={showZones ? "selected" : ""}>
              <i className="fas fa-layer-group"></i>
            </button>
          </div>
          <div className="simulation-controls">
            {!isMonitoring ? (
              <>
                <button
                  onClick={() => {
                    startMonitoring();
                    setTraveledPath([]);
                  }}
                  disabled={routes.length === 0}
                  className="monitoring-button"
                >
                  <i className="fas fa-play"></i>
                  Démarrer
                </button>

                <button
                  onClick={() => {
                    startSimulation();
                    setTraveledPath([]);
                  }}
                  disabled={routes.length === 0}
                  className="simulation-mode"
                >
                  <i className="fas fa-robot"></i>
                  Mode Simulation
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    stopMonitoring();
                    setTraveledPath([]);
                  }}
                  className="stop-button"
                >
                  <i className="fas fa-stop"></i>
                  Arrêter
                </button>

                {isSimulationMode && (
                  <>
                    <div className="simulation-progress">🚛 {simulationProgress.toFixed(1)}%</div>

                    <select
                      value={simulationSpeed}
                      onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                      className="speed-selector"
                    >
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={3}>3x</option>
                      <option value={5}>5x</option>
                    </select>
                  </>
                )}
              </>
            )}
          </div>
          {deviationMessage && <p className="deviation-message">{deviationMessage}</p>}

          {renderAlert()}
          {renderUpcomingZones()}

          <PlaceDetails
            placeDetails={placeDetails}
            showDetails={showDetails}
            expandedCard={expandedCard}
            toggleCard={toggleCard}
            handleDirectionsClick={handleDirectionsClick}
            showRouteInfo={showRouteInfo}
            isCalculatingRoute={isCalculatingRoute}
          />

          <RouteInfo
            showRouteInfo={showRouteInfo}
            routes={routes}
            remainingDistance={remainingDistance}
            remainingTime={remainingTime}
            expandedCard={expandedCard}
            toggleCard={toggleCard}
            riskAnalysis={riskAnalysis}
            selectedRouteIndex={selectedRouteIndex}
            safePathIndex={safePathIndex}
            error={error}
            setSelectedRouteIndex={setSelectedRouteIndex}
            setRouteGeometry={setRouteGeometry}
            setRouteInstructions={setRouteInstructions}
            setRemainingDistance={setRemainingDistance}
            setRemainingTime={setRemainingTime}
            setShowInstructions={setShowInstructions}
            showInstructions={showInstructions}
            routeInstructions={routeInstructions}
            onShowAnalysis={handleShowAnalysis}
          />

          {showRouteAnalysis && routes[selectedRouteIndex] && riskAnalysis[selectedRouteIndex] && (
            <RouteAnalysis
              route={routes[selectedRouteIndex]}
              riskData={riskAnalysis[selectedRouteIndex]}
              zones={zones}
              isVisible={showRouteAnalysis}
              onClose={() => setShowRouteAnalysis(false)}
              allRoutes={routes}
              allRiskData={riskAnalysis}
              selectedRouteIndex={selectedRouteIndex}
              onRouteSelect={handleRouteSelectFromAnalysis}
            />
          )}
        </div>
        <ManualLocationForm
          error={error}
          currentLocation={currentLocation}
          manualLocation={manualLocation}
          setManualLocation={setManualLocation}
          handleManualLocationSubmit={handleManualLocationSubmit}
        />
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
          100% { transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </ErrorBoundary>
  );
};

export default OpenStreetMapPage;