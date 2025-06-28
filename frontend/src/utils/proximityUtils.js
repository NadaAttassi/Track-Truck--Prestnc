import L from "leaflet"
import * as turf from '@turf/turf'

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

// Fonction utilitaire pour vérifier la distance de manière simplifiée
const checkSimplifiedDistance = (point, geometry) => {
  if (!point || !geometry || !geometry.length) return false;
  
  // Prendre quelques points de la géométrie pour la vérification
  const samplePoints = [];
  const step = Math.max(1, Math.floor(geometry.length / 5));
  
  for (let i = 0; i < geometry.length; i += step) {
    const coord = geometry[i];
    if (Array.isArray(coord) && coord.length >= 2) {
      samplePoints.push(L.latLng(coord[1], coord[0]));
    }
  }
  
  if (samplePoints.length === 0) return false;
  
  // Trouver la distance minimale à l'un des points échantillonnés
  let minDistance = Infinity;
  
  for (const sample of samplePoints) {
    try {
      const distance = point.distanceTo ? point.distanceTo(sample) : calculateDistance(
        point.lat, point.lng,
        sample.lat, sample.lng
      );
      minDistance = Math.min(minDistance, distance);
    } catch (e) {
      console.warn('Erreur lors du calcul de la distance simplifiée:', e);
    }
  }
  
  console.log(`📏 Distance simplifiée à l'itinéraire: ${minDistance.toFixed(2)}m`);
  return minDistance > 200; // Seuil plus élevé pour la méthode simplifiée
};

// Fonction utilitaire pour calculer la distance entre deux points (en mètres)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Seuil global pour la détection d'écart (camion en entreprise)
const OFF_ROUTE_THRESHOLD_METERS = 1000;

// Remplacement de la logique de détection d'écart par Turf.js pour une détection fiable
const checkIfOffRoute = (currentLocation, routeGeometry, map, offRouteThreshold = OFF_ROUTE_THRESHOLD_METERS) => {
  // Utilisation de Turf.js pour une détection fiable de l'écart
  if (!currentLocation || !Array.isArray(currentLocation) || currentLocation.length < 2) {
    console.warn('⚠️ Position actuelle invalide:', currentLocation);
    return false;
  }
  if (!routeGeometry || !Array.isArray(routeGeometry) || routeGeometry.length === 0) {
    console.warn('⚠️ Géométrie de l\'itinéraire invalide ou non définie');
    return false;
  }
  // Vérifier que la géométrie contient des points valides
  const validGeometry = routeGeometry.every(coord =>
    Array.isArray(coord) &&
    coord.length >= 2 &&
    typeof coord[0] === 'number' &&
    typeof coord[1] === 'number'
  );
  if (!validGeometry) {
    console.warn('⚠️ Format de géométrie invalide dans l\'itinéraire');
    return false;
  }
  try {
    // LOGS DEBUG : Afficher la position actuelle et les premiers points de la polyligne
    console.log('[DEBUG] Position actuelle:', currentLocation);
    console.log('[DEBUG] Premiers points de la polyligne:', routeGeometry.slice(0, 3));
    // Correction : inversion [lat, lon] -> [lon, lat] pour Turf.js
    const point = turf.point([currentLocation[1], currentLocation[0]]);
    const line = turf.lineString(routeGeometry.map(coord => [coord[1], coord[0]]));
    // Calcul de la distance en mètres
    const distance = turf.pointToLineDistance(point, line, { units: 'meters' });
    const isOffRoute = distance > offRouteThreshold;
    console.log(`📏 [Turf] Distance à l'itinéraire: ${distance.toFixed(2)}m (seuil: ${offRouteThreshold}m) - Hors itinéraire: ${isOffRoute ? 'OUI' : 'NON'}`);
    return isOffRoute;
  } catch (error) {
    console.error('❌ Erreur Turf lors du calcul de l\'écart:', error);
    return false;
  }
};

export { checkProximity, checkIfOffRoute, OFF_ROUTE_THRESHOLD_METERS }
