"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import * as turf from "@turf/turf"
import { checkIfOffRoute } from "../utils/proximityUtils"

// Fonction utilitaire pour calculer la distance entre deux points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
  setRiskAnalysis,
  setSafePathIndex
) => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [navigationStarted, setNavigationStarted] = useState(false)
  const [deviationMessage, setDeviationMessage] = useState(null)
  const [lastCheckTime, setLastCheckTime] = useState(0)
  const [showDeviationAlert, setShowDeviationAlert] = useState(false)
  const [autoReroute, setAutoReroute] = useState(true)

  // ÉTATS POUR LA SIMULATION AMÉLIORÉS
  const [isSimulationMode, setIsSimulationMode] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [simulationSpeed, setSimulationSpeed] = useState(2) // Vitesse par défaut plus stable
  const simulationIntervalRef = useRef(null)
  const currentIndexRef = useRef(0)
  const isSimulationActiveRef = useRef(false)
  // Pour éviter les faux positifs d'écart, on garde la dernière position
  const previousLocationRef = useRef(null)
  // Ajout : pour ignorer la toute première vérification de déviation
  const firstDeviationCheck = useRef(true);

  // État pour suivre si le camion a commencé à bouger
  const [hasMoved, setHasMoved] = useState(false);
  const lastPositionRef = useRef(null);
  const MIN_MOVEMENT_DISTANCE = 5; // Distance minimale en mètres pour considérer un mouvement
  
  // Référence pour la fonction handleReroute pour éviter la dépendance circulaire
  const handleRerouteRef = useRef();

  // Définir handleReroute avant de l'utiliser
  const handleReroute = useCallback(async (fromLocation, toLocation) => {
    if (!fromLocation || !toLocation) {
      const errorMsg = 'Points de départ ou d\'arrivée manquants pour le réacheminement';
      console.error(`❌ ${errorMsg}`);
      queueSpeech('Impossible de recalculer. Points de départ ou d\'arrivée manquants.');
      throw new Error(errorMsg);
    }

    // LOG: Afficher les coordonnées envoyées
    console.log('[ROUTING] Requête de réacheminement:');
    console.log('  ➤ fromLocation:', fromLocation, Array.isArray(fromLocation) ? `lat=${fromLocation[0]}, lon=${fromLocation[1]}` : 'format inconnu');
    console.log('  ➤ toLocation:', toLocation, Array.isArray(toLocation) ? `lat=${toLocation[0]}, lon=${toLocation[1]}` : 'format inconnu');

    try {
      setLoading(true);
      setDeviationMessage("Recalcul de l'itinéraire en cours...");
      queueSpeech("Vous êtes écarté de l'itinéraire, nous recherchons le chemin le plus proche pour vous. Restez prudent.");
      
      // Arrêter temporairement le monitoring pendant le recalcul
      const wasMonitoring = isMonitoring;
      if (wasMonitoring) {
        console.log('⏸️ Mise en pause du monitoring pendant le recalcul...');
        setIsMonitoring(false);
      }
      
      // Utiliser un timeout pour éviter les requêtes trop longues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      try {
        // LOG: Avant appel API
        console.log('[ROUTING] Appel fetchRouteFromServer...');
        const newRoutes = await fetchRouteFromServer(
          fromLocation,
          toLocation,
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
          { signal: controller.signal }
        );
        // LOG: Réponse brute
        console.log('[ROUTING] Réponse fetchRouteFromServer:', newRoutes);
        
        if (newRoutes && newRoutes.length > 0) {
          // Mettre à jour les routes disponibles
          setRoutes(newRoutes);
          setSelectedRouteIndex(0); // Sélectionner le premier itinéraire par défaut
          
          // Mettre à jour la géométrie et les instructions de l'itinéraire sélectionné
          const selectedRoute = newRoutes[0];
          setRouteGeometry(selectedRoute.geometry);
          setRouteInstructions(selectedRoute.instructions || []);
          setRemainingDistance(selectedRoute.distance || 0);
          setRemainingTime(selectedRoute.duration || 0);
          
          // Synchroniser la position du camion sur le début du nouveau chemin
          if (selectedRoute.geometry && selectedRoute.geometry.length > 0) {
            setCurrentLocation([selectedRoute.geometry[0][0], selectedRoute.geometry[0][1]]);
          }
          
          // Afficher une notification à l'utilisateur
          const message = 'Nouvel itinéraire calculé avec succès.';
          console.log(`✅ ${message}`);
          queueSpeech(message);
          
          // Masquer l'alerte de déviation
          setShowDeviationAlert(false);
          setDeviationMessage(null);
          
          return true;
        } else {
          // LOG: Pas de route trouvée
          console.error('[ROUTING] Aucun itinéraire valide retourné par le serveur pour:', { fromLocation, toLocation });
          throw new Error('Aucun itinéraire valide retourné par le serveur');
        }
      } catch (error) {
        // LOG: Erreur lors de l'appel API
        if (error.response) {
          console.error('[ROUTING] Erreur API:', {
            status: error.response.status,
            data: error.response.data,
            url: error.config && error.config.url
          });
        } else {
          console.error('[ROUTING] Erreur inconnue lors de l\'appel API:', error);
        }
        clearTimeout(timeoutId);
        throw error; // Propage l'erreur pour la gérer dans le bloc catch externe
      }
    } catch (error) {
      const errorMsg = `Erreur lors du réacheminement: ${error.name === 'AbortError' ? 'Délai dépassé' : error.message}`;
      console.error(`❌ ${errorMsg}`, error);
      // Afficher l'erreur à l'utilisateur
      setError(errorMsg);
      // Redémarrer le monitoring si c'était actif avant
      if (isMonitoring) {
        console.log('▶️ Reprise du monitoring après échec du recalcul...');
        setIsMonitoring(true);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    setRoutes, 
    setSelectedRouteIndex, 
    setRouteGeometry, 
    setRouteInstructions, 
    setRemainingDistance, 
    setRemainingTime, 
    setLoading, 
    setError, 
    queueSpeech, 
    setShowDeviationAlert, 
    isMonitoring, 
    setIsMonitoring,
    setDeviationMessage,
    setCurrentLocation,
    fetchRouteFromServer,
    setRiskAnalysis,
    setSafePathIndex,
    setShowRouteInfo,
    setShowInstructions
  ]);

  // Mettre à jour la référence quand handleReroute change
  useEffect(() => {
    handleRerouteRef.current = handleReroute;
  }, [handleReroute]);

  // Définition de recalculateRoutes qui utilise handleReroute
  const recalculateRoutes = useCallback(async () => {
    if (!currentLocation || !positionArrivee) {
      setError("Impossible de recalculer l'itinéraire : position ou destination manquante.")
      queueSpeech('Position ou destination manquante.')
      return
    }

    setLoading(true)
    try {
      await handleReroute(currentLocation, positionArrivee)
      setShowRouteInfo(true)
      setShowInstructions(false)
    } catch (error) {
      console.error('Erreur lors du recalcul de l\'itinéraire:', error)
      setError(`Erreur lors du recalcul de l'itinéraire: ${error.message}`)
      queueSpeech('Erreur lors du recalcul de l\'itinéraire.')
    } finally {
      setLoading(false)
    }
  }, [
    currentLocation, 
    positionArrivee, 
    handleReroute, 
    setError, 
    setLoading, 
    setShowRouteInfo, 
    setShowInstructions, 
    queueSpeech
  ])

  // Fonction pour vérifier la déviation
  const checkDeviation = useCallback(() => {
    console.log('[MONITORING] Vérification de déviation...');
    // Vérifier les conditions de base
    if (!isMonitoring && isSimulationMode) {
      // En simulation, on peut désactiver le monitoring
      console.log('[MONITORING] Monitoring désactivé (simulation)');
      return;
    }
    if (!isMonitoring && !isSimulationMode) {
      // En navigation réelle, ne jamais désactiver automatiquement
      console.warn('[MONITORING] Monitoring désactivé alors que la navigation réelle est active.');
      return;
    }
    
    if (!currentLocation || !Array.isArray(currentLocation) || currentLocation.length < 2) {
      console.warn('[MONITORING] Position actuelle invalide:', currentLocation);
      return;
    }

    // Vérifier que la position actuelle est valide
    const [lat, lng] = currentLocation;
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('[MONITORING] Coordonnées GPS invalides:', { lat, lng });
      return;
    }
    
    // Vérifier que nous avons un itinéraire valide
    const route = routes[selectedRouteIndex];
    if (!route || !route.geometry || !Array.isArray(route.geometry) || route.geometry.length === 0) {
      console.warn('[MONITORING] Aucun itinéraire valide chargé');
      return;
    }

    // --- LOGIQUE SIMULATION ---
    if (isSimulationMode) {
      // On utilise checkIfOffRoute (Leaflet, etc.) uniquement pour la simulation
      const routeGeometry = routes[selectedRouteIndex]?.geometry;
      try {
        const isOffRoute = checkIfOffRoute(currentLocation, routeGeometry);
        if (isOffRoute) {
          console.log('[SIMULATION] Déviation détectée');
          setDeviationMessage("Simulation - Détection d'écart de l'itinéraire");
          if (autoReroute) {
            queueSpeech("Simulation - Recalcul de l'itinéraire en cours");
            recalculateRoutes();
          }
        } else {
          setDeviationMessage(null);
        }
      } catch (error) {
        console.error('[SIMULATION] Erreur lors de la vérification de la déviation:', error);
      }
      return;
    }

    // --- LOGIQUE MONITORING RÉEL ---
    try {
      // Mise à jour de la position précédente
      if (!lastPositionRef.current) {
        lastPositionRef.current = [...currentLocation];
        console.log('[MONITORING] Initialisation de la position de référence');
        return; // Première position, on attend le prochain point
      }
      const [prevLat, prevLng] = lastPositionRef.current;
      const [currentLat, currentLng] = currentLocation;
      console.log(`[MONITORING] Position actuelle: [${currentLat}, ${currentLng}], Précédente: [${prevLat}, ${prevLng}]`);
      if (isNaN(prevLat) || isNaN(prevLng) || isNaN(currentLat) || isNaN(currentLng)) {
        console.warn('[MONITORING] Coordonnées GPS invalides:', { prevLat, prevLng, currentLat, currentLng });
        return;
      }
      if (Math.abs(currentLat) > 90 || Math.abs(currentLng) > 180) {
        console.warn('[MONITORING] Coordonnées GPS hors limites:', { currentLat, currentLng });
        return;
      }
      // Calculer la distance depuis la dernière position
      const dist = calculateDistance(prevLat, prevLng, currentLat, currentLng);
      console.log(`[MONITORING] Distance déplacement GPS: ${dist.toFixed(2)} mètres`);
      if (dist > MIN_MOVEMENT_DISTANCE) {
        console.log(`[MONITORING] Déplacement détecté: ${dist.toFixed(2)} m`);
        setHasMoved(true);
      } else if (!hasMoved) {
        console.log('[MONITORING] Pas assez de mouvement, attente...');
        lastPositionRef.current = [currentLat, currentLng];
        return;
      }
      lastPositionRef.current = [currentLat, currentLng];
      // Vérifier la géométrie de l'itinéraire
      const route = routes[selectedRouteIndex];
      if (!route || !route.geometry || !Array.isArray(route.geometry) || route.geometry.length === 0) {
        console.warn('[MONITORING] Géométrie de l\'itinéraire invalide');
        return;
      }
      // --- NOUVEAU : Utiliser Turf.js pour la détection d'écart ---
      const routeGeometry = route.geometry;
      const isOffRoute = checkIfOffRoute(currentLocation, routeGeometry);
      if (firstDeviationCheck.current) {
        console.log('[MONITORING] Première vérification de déviation ignorée');
        firstDeviationCheck.current = false;
        setDeviationMessage(null);
        return;
      }
      if (isOffRoute) {
        setDeviationMessage('Déviation détectée (Turf.js)');
        queueSpeech("Déviation détectée, recalcul de l'itinéraire...");
        setTimeout(() => {
          if (currentLat >= -90 && currentLat <= 90 && currentLng >= -180 && currentLng <= 180) {
            console.log('[MONITORING] Lancement du recalcul de l\'itinéraire...');
            recalculateRoutes();
          } else {
            console.warn('[MONITORING] Position actuelle invalide pour le recalcul:', currentLocation);
          }
        }, 2000);
      } else {
        setDeviationMessage(null);
      }
    } catch (error) {
      console.error('[MONITORING] Erreur lors de la vérification de déviation:', error);
    }
  }, [
    isMonitoring, 
    currentLocation, 
    routes, 
    selectedRouteIndex, 
    queueSpeech, 
    isSimulationMode, 
    autoReroute, 
    hasMoved, 
    MIN_MOVEMENT_DISTANCE,
    recalculateRoutes,
    setDeviationMessage,
    setHasMoved,
    checkIfOffRoute,
    setError,
    setLoading,
    setIsMonitoring
  ])

  // handleReroute est maintenant défini plus haut dans le code

  // Fonction utilitaire pour arrêter la simulation sans réinitialiser la position
  const stopSimulationWithoutReset = useCallback(() => {
    console.log("⏹️ Arrêt de la simulation (sans réinitialisation de position)");
    isSimulationActiveRef.current = false;
    setIsSimulationMode(false);
    setIsMonitoring(false); // Ajout ici pour revenir à l'état initial UI
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, [setIsSimulationMode, setIsMonitoring]);

  // Fonction pour arrêter la simulation avec ou sans réinitialisation de la position
  const stopSimulation = useCallback((keepPosition = false) => {
    console.log(`⏹️ Arrêt de la simulation (${keepPosition ? 'sans' : 'avec'} réinitialisation de la position)`);
    
    // Arrêter la simulation sans réinitialiser la position
    stopSimulationWithoutReset();
    
    // Si on ne garde pas la position, réinitialiser à la position de départ
    if (!keepPosition) {
      const geometry = routes[selectedRouteIndex]?.geometry;
      if (geometry && geometry.length > 0) {
        setCurrentLocation([geometry[0][0], geometry[0][1]]);
      }
      setSimulationProgress(0);
      currentIndexRef.current = 0;
    }
  }, [stopSimulationWithoutReset, routes, selectedRouteIndex, setCurrentLocation]);

  // 🚛 FONCTION DE SIMULATION AMÉLIORÉE ET PLUS FIABLE
  const [pendingSimulation, setPendingSimulation] = useState(false);
  const [pendingSimulationForceToStart, setPendingSimulationForceToStart] = useState(true);

  const startSimulation = useCallback((forceToStart = true) => {
    if (!routes[selectedRouteIndex] || !routes[selectedRouteIndex].geometry) {
      setError("Aucun itinéraire sélectionné pour la simulation.");
      return;
    }
    const geometry = routes[selectedRouteIndex].geometry;
    if (geometry.length > 0) {
      setPendingSimulation(true);
      setPendingSimulationForceToStart(forceToStart);
      if (forceToStart) {
        setCurrentLocation([geometry[0][0], geometry[0][1]]);
      }
    }
  }, [routes, selectedRouteIndex, setCurrentLocation, setError]);

  // Effet pour démarrer la simulation SEULEMENT quand la position est bien à geometry[0] (ou déjà positionnée)
  useEffect(() => {
    if (!pendingSimulation) return;
    const geometry = routes[selectedRouteIndex]?.geometry;
    if (!geometry || geometry.length === 0) return;
    // Toujours démarrer à l'index 0
    setCurrentLocation([geometry[0][0], geometry[0][1]]);
    currentIndexRef.current = 0;
    setIsSimulationMode(true);
    setIsMonitoring(true);
    setNavigationStarted(true);
    setSimulationProgress(0);
    setDeviationMessage(null);
    isSimulationActiveRef.current = true;
    queueSpeech("Simulation de navigation démarrée.");
    // Fonction de simulation avec gestion d'erreurs
    const simulateMovement = () => {
      if (!isSimulationActiveRef.current || !geometry || geometry.length === 0) {
        return;
      }
      const currentIndex = currentIndexRef.current;
      if (currentIndex < geometry.length - 1) {
        const nextIndex = Math.min(currentIndex + simulationSpeed, geometry.length - 1);
        currentIndexRef.current = nextIndex;
        const newPosition = [geometry[nextIndex][0], geometry[nextIndex][1]];
        setCurrentLocation(newPosition);
        const progress = (nextIndex / (geometry.length - 1)) * 100;
        setSimulationProgress(progress);
        console.log(
          `[SIMULATION] ${progress.toFixed(1)}% - Index: ${nextIndex}/${geometry.length - 1} - Position: [${newPosition[0].toFixed(6)}, ${newPosition[1].toFixed(6)}]`,
        );
        if (nextIndex >= geometry.length - 1) {
          console.log("🏁 Simulation terminée - Arrivée à destination");
          queueSpeech("Simulation terminée. Vous êtes arrivé à destination.");
          stopSimulationWithoutReset();
        }
      }
    };
    simulationIntervalRef.current = setInterval(simulateMovement, 500);
    setPendingSimulation(false);
  }, [pendingSimulation, pendingSimulationForceToStart, routes, selectedRouteIndex, simulationSpeed, setCurrentLocation, setIsSimulationMode, setIsMonitoring, setNavigationStarted, setSimulationProgress, setDeviationMessage, queueSpeech]);

  // 🚛 FONCTION POUR SIMULER UN ÉCART DE L'ITINÉRAIRE (déplacement aléatoire, fixe, puis recalcul)
  const simulateDeviation = useCallback(async () => {
    if (!routes[selectedRouteIndex] || !routes[selectedRouteIndex].geometry) {
      setError("Aucun itinéraire sélectionné pour la simulation d'écart.");
      return;
    }
    const geometry = routes[selectedRouteIndex].geometry;
    if (!Array.isArray(geometry) || geometry.length === 0) {
      setError("Géométrie d'itinéraire invalide pour la simulation d'écart.");
      return;
    }
    // Prendre la position actuelle comme base
    const basePosition = currentLocation && Array.isArray(currentLocation) && currentLocation.length === 2
      ? currentLocation
      : geometry[0];
    // Générer un offset aléatoire entre 1 et 3 km
    const offsetKm = 1 + Math.random() * 2; // 1 à 3 km
    const earthRadius = 6371; // km
    const angle = Math.random() * 2 * Math.PI;
    // Calculer le nouveau point (approximation sphérique)
    const deltaLat = (offsetKm / earthRadius) * (180 / Math.PI) * Math.cos(angle);
    const deltaLng = (offsetKm / earthRadius) * (180 / Math.PI) * Math.sin(angle) / Math.cos(basePosition[0] * Math.PI / 180);
    const newLat = basePosition[0] + deltaLat;
    const newLng = basePosition[1] + deltaLng;
    // Déplacer le camion à la nouvelle position
    setCurrentLocation([newLat, newLng]);
    setDeviationMessage("Déviation simulée : le camion a été déplacé à une nouvelle position.");
    setShowDeviationAlert(true);
    queueSpeech("Déviation simulée. Recalcul de l'itinéraire en cours.");
    // Arrêter la simulation pendant le recalcul
    isSimulationActiveRef.current = false;
    setIsSimulationMode(false);
    setIsMonitoring(false); // Ajout : repasser à l'état initial
    setNavigationStarted(false); // Ajout : repasser à l'état initial
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    // Lancer le recalcul d'itinéraire avec la nouvelle position
    await handleReroute([newLat, newLng], positionArrivee);
    // NE PAS relancer la simulation automatiquement
    // Après recalcul, revenir à l'état initial (choix des modes)
    setIsSimulationMode(false);
    setIsMonitoring(false);
    setNavigationStarted(false);
    setDeviationMessage(null);
    setShowDeviationAlert(false);
  }, [routes, selectedRouteIndex, currentLocation, setCurrentLocation, setDeviationMessage, setShowDeviationAlert, queueSpeech, handleReroute, positionArrivee, setError]);

  // 🚛 FONCTION DE DÉBUT DE LA NAVIGATION
  const startMonitoring = useCallback(() => {
    if (!routes[selectedRouteIndex] || !routes[selectedRouteIndex].geometry) {
      setError("Aucun itinéraire sélectionné pour la navigation.");
      return;
    }

    setIsMonitoring(true);
    setNavigationStarted(true);
    setDeviationMessage(null);
    setLastCheckTime(0);
    setHasMoved(false); // Toujours réinitialiser à false au démarrage
    lastPositionRef.current = null;
    firstDeviationCheck.current = true;
    // Le timer est maintenant géré par useEffect
  }, [routes, selectedRouteIndex, checkDeviation, setError]);

  // TIMER DE MONITORING CONTINU (robuste)
  useEffect(() => {
    let intervalId = null;
    if (isMonitoring && !isSimulationMode) {
      intervalId = setInterval(checkDeviation, 5000);
      console.log('[MONITORING] Timer de vérification lancé (mode réel)');
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMonitoring, isSimulationMode, checkDeviation]);

  // Fonction pour arrêter le monitoring (navigation réelle)
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    setNavigationStarted(false);
    setDeviationMessage(null);
    setShowDeviationAlert(false);
    setAutoReroute(true);
    setSimulationProgress(0);
    setIsSimulationMode(false);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  // Return the hook exports
  return {
    isMonitoring,
    setIsMonitoring,
    navigationStarted,
    setNavigationStarted,
    deviationMessage,
    setDeviationMessage,
    showDeviationAlert,
    setShowDeviationAlert,
    autoReroute,
    setAutoReroute,
    isSimulationMode,
    setIsSimulationMode,
    simulationProgress,
    setSimulationProgress,
    simulationSpeed,
    setSimulationSpeed,
    handleReroute,
    simulateDeviation,
    startMonitoring,
    stopMonitoring,
    startSimulation,
    stopSimulation: stopSimulationWithoutReset
  };
};

export default useMonitoring;
