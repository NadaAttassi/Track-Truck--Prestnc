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
import { checkProximity, checkIfOffRoute } from "../utils/proximityUtils";
import "./OpenStreetMapPage.css";

const OpenStreetMapPage = () => {
  const [error, setError] = useState(null);
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
  const [hasSelectedDestination, setHasSelectedDestination] = useState(false);
  const [isMonitoringTest, setIsMonitoringTest] = useState(false);
  const [onTruckDrag, setOnTruckDrag] = useState(null);

  const { currentLocation, setCurrentLocation, isLoadingLocation } = useGeolocation(setError);
  const { searchQuery, setSearchQuery, suggestions, setSuggestions, fetchSuggestions } = useSuggestions(setError);
  const { queueSpeech, isSpeaking } = useSpeechQueue();
  const { riskAnalysis, setRiskAnalysis, safePathIndex, setSafePathIndex, fetchRiskAnalysis } = useRiskAnalysis();
  const { zones, showZones, handleShowZonesClick } = useZones(setError);
  const { heading, speed } = useDeviceOrientation();

  const { fetchRouteFromServer } = useRoute(
    fetchRiskAnalysis,
    zones,
    setError,
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
    setShowRouteInfo
  );

  // Définir la fonction handleSearchChange
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchSuggestions(value);
    if (value) {
      setHasSelectedDestination(false);
    }
  }, [setSearchQuery, fetchSuggestions]);

  const {
    isMonitoring,
    deviationMessage,
    startMonitoring,
    stopMonitoring,
    isSimulationMode,
    simulationProgress,
    simulationSpeed,
    simulationIntervalRef,
    setSimulationSpeed,
    startSimulation,
    stopSimulation,
    simulateDeviation,
    autoReroute,
    setShowDeviationAlert,
    handleReroute,
    setIsMonitoring,
    setIsSimulationMode,
    setDeviationMessage
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
    setRiskAnalysis,
    setSafePathIndex
  );

  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [upcomingZones, setUpcomingZones] = useState([]);
  const endPoint = positionArrivee;

  const findClosestPointOnRoute = useCallback(() => {
    if (!currentLocation || !routeGeometry || routeGeometry.length === 0 || !isMonitoring) return null;

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
        closestIndex = i;
      }
    }

    if (closestIndex >= 0) {
      const newTraveledPath = routeGeometry.slice(0, closestIndex + 1);
      setTraveledPath(newTraveledPath);
    }

    return { index: closestIndex };
  }, [currentLocation, routeGeometry, isMonitoring, setTraveledPath]);

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
      setPinPosition(null); // Effacer le pin si présent
      // Utiliser les informations de type de la suggestion ou définir des valeurs par défaut
      const placeType = suggestion.type || "Lieu";
      const placeCategory = suggestion.category || "default";
      
      setPlaceDetails({
        name: suggestion.name,
        type: placeType,
        [placeCategory]: placeType, // Ajouter la catégorie comme propriété
        city: suggestion.city || "Ville inconnue",
        lat: suggestion.lat,
        lon: suggestion.lon,
      });
      setShowDetails(true);
      setExpandedCard('place'); // Ouvrir automatiquement le panneau de détails
      setSearchQuery(`${suggestion.name}, ${suggestion.city}`);
      setSuggestions([]);
      setError(null);
      setRoutes([]);
      setRouteInstructions([]);
      setRouteGeometry([]);
      setRemainingDistance(0);
      setRemainingTime(0);
      setShowRouteInfo(false);
      setShowInstructions(false);
      setSelectedRouteIndex(0);
      setHasSelectedDestination(true); // Marquer qu'une destination a été sélectionnée
    },
    [setError, setSearchQuery, setSuggestions, setPositionArrivee, setPlaceDetails, setShowDetails, setRoutes, setRouteInstructions, setRouteGeometry, setRemainingDistance, setRemainingTime, setShowRouteInfo, setShowInstructions, setSelectedRouteIndex, setExpandedCard],
  );
  
  const handleClearDestination = useCallback(() => {
    setPositionArrivee(null);
    setPinPosition(null);
    setPlaceDetails(null);
    setSearchQuery("");
    setHasSelectedDestination(false);
    setRoutes([]);
    setRouteInstructions([]);
    setRouteGeometry([]);
    setShowRouteInfo(false);
    setSuggestions([]); // Réinitialiser les suggestions
  }, [setSearchQuery]);

  const handlePlacePin = useCallback(() => {
    setIsPinMode(true);
    setSuggestions([]);
    setSearchQuery("");
  }, [setIsPinMode, setSuggestions, setSearchQuery]);

  const handleDirectionsClick = useCallback(() => {
    console.log("🎯 handleDirectionsClick - État actuel:", { showRouteInfo, routesLength: routes?.length || 0 });

    if (showRouteInfo) {
      setShowRouteInfo(false);
      setShowInstructions(false);
      setExpandedCard("place");
      return;
    }

    // Réinitialiser l'état de l'itinéraire avant de recalculer
    setRoutes([]);
    setRouteInstructions([]);
    setRouteGeometry([]);
    setRemainingDistance(0);
    setRemainingTime(0);
    setShowRouteInfo(true);
    setShowInstructions(false);
    setSelectedRouteIndex(0);
    
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

  const handleMapClick = useCallback((e) => {
    if (isPinMode) {
      const { lat, lng } = e.latlng;
      setPinPosition([lat, lng]);
      setPositionArrivee([lat, lng]);
      setPlaceDetails({
        name: "Point personnalisé",
        type: "custom",
        custom: "point_personnalise",
        city: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat: lat,
        lon: lng,
      });
      setShowDetails(true);
      setExpandedCard('place'); // Ouvrir automatiquement le panneau de détails
      setIsPinMode(false);
      setHasSelectedDestination(true);
      setSuggestions([]);
      setSearchQuery("");
      // Réinitialiser l'état de l'itinéraire
      setRoutes([]);
      setRouteInstructions([]);
      setRouteGeometry([]);
      setRemainingDistance(0);
      setRemainingTime(0);
      setShowRouteInfo(false);
      setShowInstructions(false);
      setSelectedRouteIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [isPinMode, setExpandedCard]);

  const handleCancelPinMode = useCallback(() => {
    setIsPinMode(false);
  }, []);

  useEffect(() => {
    if (isPinMode) {
      // Réinitialiser l'état de l'itinéraire
      setRoutes([]);
      setRouteInstructions([]);
      setRouteGeometry([]);
      setRemainingDistance(0);
      setRemainingTime(0);
      setShowRouteInfo(false);
      setShowInstructions(false);
      setSelectedRouteIndex(0);
      
      // Ajouter l'écouteur d'événement
      window.addEventListener('cancelPinMode', handleCancelPinMode);
    } else {
      setSuggestions([]);
    }

    // Nettoyer l'écouteur d'événement lors du démontage
    return () => {
      window.removeEventListener('cancelPinMode', handleCancelPinMode);
    };
  }, [isPinMode, handleCancelPinMode]);

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
            backgroundColor: "rgba(23,162,184,0.9)",
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

      const { index: closestIndex } = closest;

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

  // Référence à l'instance de la carte
  const mapRef = useRef(null);

  // Vérifie si le camion est sorti de l'itinéraire
  const checkRouteDeviation = useCallback(() => {
    if (!isMonitoring || !currentLocation || !routes[selectedRouteIndex]?.geometry) {
      console.log('Vérification de déviation ignorée - conditions non remplies');
      return false;
    }
    
    try {
      const currentRouteGeometry = routes[selectedRouteIndex].geometry;
      if (!Array.isArray(currentRouteGeometry) || currentRouteGeometry.length === 0) {
        console.warn('Géométrie de l\'itinéraire invalide');
        return false;
      }
      
      console.log('Vérification de la déviation...');
      console.log('Position actuelle:', currentLocation);
      console.log('Géométrie de l\'itinéraire:', currentRouteGeometry.length, 'points');
      
      // Passer la référence à la carte (mapRef) plutôt que mapRef.current
      const isOffRoute = checkIfOffRoute(currentLocation, currentRouteGeometry, mapRef);
      
      if (isOffRoute) {
        console.log('🚨 Déviation détectée !');
      } else {
        console.log('✅ Toujours sur l\'itinéraire');
      }
      
      return isOffRoute;
    } catch (error) {
      console.error('Erreur lors de la vérification de la déviation:', error);
      return false;
    }
  }, [currentLocation, isMonitoring, routes, selectedRouteIndex]);

  // Vérifie périodiquement si le camion est sorti de l'itinéraire
  useEffect(() => {
    if (!isMonitoring) return;
    
    const checkDeviation = async () => {
      // Ne pas vérifier la déviation si un recalcul est déjà en cours
      if (isRecalculating) {
        console.log('⏳ Recalcul en cours, vérification de déviation ignorée');
        return;
      }
      
      const isOffRoute = checkRouteDeviation();
      
      if (isOffRoute) {
        console.log('⚠️ Déviation détectée !');
        setShowDeviationAlert(true);
        
        // Si le mode de réacheminement automatique est activé, calculer un nouvel itinéraire
        if (autoReroute && !isRecalculating) {
          console.log('🔄 Tentative de réacheminement automatique...');
          try {
            setIsRecalculating(true);
            await handleReroute(currentLocation, endPoint);
            console.log('✅ Réacheminement réussi');
          } catch (error) {
            console.error('❌ Échec du réacheminement:', error);
          } finally {
            // Attendre un peu avant de permettre un nouveau recalcul
            setTimeout(() => {
              setIsRecalculating(false);
              console.log('🔄 Prêt pour une nouvelle vérification de déviation');
            }, 5000); // Attendre 5 secondes avant de permettre un nouveau recalcul
          }
        }
      }
    };
    
    // Vérifier la déviation toutes les 3 secondes (au lieu d'une seconde pour éviter la surcharge)
    const intervalId = setInterval(checkDeviation, 3000);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, [checkRouteDeviation, autoReroute, currentLocation, endPoint, handleReroute, isMonitoring, isRecalculating]);

  const handleSimulateDeviation = useCallback(() => {
    // Utiliser directement la fonction du hook useMonitoring
    simulateDeviation();
  }, [simulateDeviation]);

  return (
    <ErrorBoundary>
      <div className={`open-street-map-page ${isPinMode ? "map-pin-mode" : ""}`}>
        <div className="map-container">
          <MapComponent
            ref={mapRef}
            mapCenter={positionArrivee || currentLocation || [33.5731, -7.5898]}
            currentLocation={currentLocation}
            positionArrivee={positionArrivee}
            routeGeometry={routeGeometry}
            selectedRouteIndex={selectedRouteIndex}
            safePathIndex={safePathIndex}
            showZones={showZones}
            zones={zones}
            heading={speed > 1 ? heading : null}
            isMonitoring={isMonitoring}
            isSimulation={isSimulationMode}
            traveledPath={traveledPath}
            onMapClick={handleMapClick}
            isPinMode={isPinMode}
            isDraggable={isMonitoringTest}
            onTruckDrag={onTruckDrag}
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
            setSuggestions={setSuggestions}
            suggestions={suggestions}
            handleSelectSuggestion={handleSelectSuggestion}
            currentLocation={currentLocation}
            handlePlacePin={handlePlacePin}
            hasSelectedDestination={hasSelectedDestination}
          />
          <div className="show-zones-button">
            <button onClick={handleShowZonesClick} className={showZones ? "selected" : ""}>
              <i className="fas fa-layer-group"></i>
            </button>
          </div>
          {/* Afficher un message d'instruction pour le test d'écart (toujours visible en mode simulation, juste au-dessus des boutons) */}
          {isSimulationMode && (
            <div className="simulation-hint">
              <i className="fas fa-lightbulb"></i> Utilisez le bouton "Tester écart" pour simuler une déviation de l'itinéraire
            </div>
          )}
          <div className="simulation-controls">
            {!isMonitoring && !isSimulationMode ? (
              <>
                <button
                  onClick={() => {
                    // Démarrer uniquement le monitoring réel
                    startMonitoring();
                    setTraveledPath([]);
                    setIsMonitoringTest(true); // Activer le mode test monitoring
                  }}
                  disabled={routes.length === 0}
                  className="monitoring-button"
                >
                  Démarrer
                </button>

                <button
                  onClick={() => {
                    // Démarrer uniquement la simulation
                    startSimulation();
                    setTraveledPath([]);
                    setIsMonitoringTest(false);
                  }}
                  disabled={routes.length === 0}
                  className="simulation-mode"
                >
                  Mode Simulation
                </button>
              </>
            ) : (
              isSimulationMode ? (
                <>
                  <button
                    onClick={() => {
                      stopSimulation();
                      setTraveledPath([]);
                    }}
                    className="stop-button"
                  >
                    Arrêter
                  </button>
                  <div className="simulation-progress">
                    <span className="truck-icon">
                      <svg width="24" height="24" viewBox="0 0 50 50" style={{verticalAlign: 'middle'}} xmlns="http://www.w3.org/2000/svg">
                        <g>
                          <ellipse cx="26" cy="42" rx="18" ry="4" fill="rgba(0,0,0,0.3)"/>
                          <rect x="15" y="20" width="20" height="12" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1"/>
                          <rect x="10" y="18" width="10" height="10" rx="2" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1"/>
                          <rect x="11" y="19" width="8" height="4" rx="1" fill="#87ceeb" stroke="#4682b4" strokeWidth="0.5"/>
                          <circle cx="14" cy="30" r="3" fill="#2d3748" stroke="#1a202c" strokeWidth="1"/>
                          <circle cx="14" cy="30" r="1.5" fill="#4a5568"/>
                          <circle cx="25" cy="30" r="3" fill="#2d3748" stroke="#1a202c" strokeWidth="1"/>
                          <circle cx="25" cy="30" r="1.5" fill="#4a5568"/>
                          <circle cx="30" cy="30" r="3" fill="#2d3748" stroke="#1a202c" strokeWidth="1"/>
                          <circle cx="30" cy="30" r="1.5" fill="#4a5568"/>
                          <circle cx="8" cy="21" r="1.5" fill="#fbbf24" opacity="0.7"/>
                          <circle cx="8" cy="25" r="1.5" fill="#fbbf24" opacity="0.7"/>
                          <polygon points="38,25 42,23 42,27" fill="#ef4444"/>
                          <rect x="11" y="24" width="2" height="3" rx="0.5" fill="#374151"/>
                          <rect x="15" y="24" width="2" height="3" rx="0.5" fill="#374151"/>
                          <rect x="7" y="20" width="1" height="6" fill="#6b7280"/>
                          <line x1="7.5" y1="21" x2="7.5" y2="25" stroke="#9ca3af" strokeWidth="0.3"/>
                        </g>
                      </svg>
                    </span>{simulationProgress.toFixed(1)}%
                  </div>
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
                  <button
                    onClick={simulateDeviation}
                    className="deviation-button"
                    title="Simuler un écart de l'itinéraire"
                  >
                    <i className="fas fa-random"></i> Tester écart
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    stopMonitoring();
                    setTraveledPath([]);
                  }}
                  className="stop-button"
                >
                  Arrêter
                </button>
              )
            )}
          </div>
          {deviationMessage && <p className="deviation-message">{deviationMessage}</p>}

          {renderAlert()}
          {renderUpcomingZones()}
          
          <PlaceDetails
            placeDetails={placeDetails}
            showDetails={showDetails}
            expandedCard={expandedCard}
            toggleCard={(card) => {
              console.log("🔄 Toggle card:", card, "current:", expandedCard);
              if (expandedCard === card) {
                setExpandedCard("none");
              } else {
                setExpandedCard(card);
              }
            }}
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
            toggleCard={(card) => {
              console.log("🔄 Toggle card:", card, "current:", expandedCard);
              if (expandedCard === card) {
                setExpandedCard("none");
              } else {
                setExpandedCard(card);
              }
            }}
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