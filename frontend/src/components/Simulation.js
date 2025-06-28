"use client"

import { useState, useEffect, useCallback } from 'react';
import SimulationControls from './SimulationControls';
import L from 'leaflet';
import { createTruckIcon } from './TruckIcon';

const Simulation = ({ route, onRecalculateRoute, map, checkIfOffRoute }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [truckPosition, setTruckPosition] = useState(null);
  const [isMonitoringTest, setIsMonitoringTest] = useState(false);
  const [isTestingDeviation, setIsTestingDeviation] = useState(false);
  const [deviationThreshold] = useState(50); // mètres
  const [truckMarker, setTruckMarker] = useState(null);

  const calculateDeviation = useCallback((position, routeGeometry) => {
    if (!routeGeometry || routeGeometry.length === 0) return 0;
    
    // Trouver le point le plus proche sur la route
    let minDistance = Infinity;
    
    for (let i = 0; i < routeGeometry.length - 1; i++) {
      const pointA = routeGeometry[i];
      const pointB = routeGeometry[i + 1];
      const distance = pointToLineDistance(position, pointA, pointB);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }, []);

  const handleTruckDrag = useCallback((newPosition) => {
    if (!isMonitoringTest) return;

    setTruckPosition(newPosition);
    
    // Calculer la déviation par rapport à la route
    const deviation = calculateDeviation(newPosition, route?.geometry || []);
    
    if (deviation > deviationThreshold) {
      console.log(`🚨 Déviation détectée: ${deviation.toFixed(2)}m`);
      // Recalculer l'itinéraire depuis la nouvelle position
      onRecalculateRoute(newPosition);
    }
  }, [isMonitoringTest, route?.geometry, onRecalculateRoute, deviationThreshold, calculateDeviation]);

  useEffect(() => {
    if (!route || !route.geometry || route.geometry.length === 0) return;
    
    // Réinitialiser la position du camion au début de la route
    const startPosition = route.geometry[0];
    setTruckPosition(startPosition);
    
    // Créer ou mettre à jour le marqueur du camion
    if (map && startPosition) {
      // Supprimer l'ancien marqueur s'il existe
      if (truckMarker) {
        map.removeLayer(truckMarker);
      }
      const marker = L.marker(startPosition, {
        icon: createTruckIcon(),
        draggable: isMonitoringTest
      });

      marker.addTo(map);
      setTruckMarker(marker);

      // Gestionnaire d'événements pour le début du glissement
      marker.on('dragstart', () => {
        if (!isMonitoringTest) return;
        marker.getElement().style.cursor = 'grabbing';
        marker.setIcon(createTruckIcon());
      });

      // Gestionnaire d'événements pendant le glissement
      marker.on('drag', (e) => {
        if (!isMonitoringTest) return;
        const pos = e.target.getLatLng();
        setTruckPosition([pos.lat, pos.lng]);
      });

      // Gestionnaire d'événements pour la fin du glissement
      marker.on('dragend', (e) => {
        if (!isMonitoringTest) return;
        marker.getElement().style.cursor = 'grab';
        marker.setIcon(createTruckIcon());
        const newPos = e.target.getLatLng();
        handleTruckDrag([newPos.lat, newPos.lng]);
      });
    }

    return () => {
      if (truckMarker) {
        truckMarker.remove();
      }
    };
  }, [route, map, isMonitoringTest, truckMarker, handleTruckDrag]);

  useEffect(() => {
    if (truckMarker) {
      truckMarker.setLatLng(truckPosition);
      truckMarker.dragging[isMonitoringTest ? 'enable' : 'disable']();
      
      // Mettre à jour le style du curseur
      const element = truckMarker.getElement();
      if (element) {
        element.style.cursor = isMonitoringTest ? 'grab' : 'default';
      }
      
      // Ajouter une classe CSS pour l'animation
      truckMarker.setIcon(createTruckIcon());
    }
  }, [truckPosition, isMonitoringTest, truckMarker]);

  const startSimulation = () => {
    setIsSimulating(true);
    if (route && route.geometry && route.geometry.length > 0) {
      setTruckPosition(route.geometry[0]);
    }
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setIsMonitoringTest(false);
    // S'assurer que le marqueur est bien à sa position initiale
    if (route && route.geometry && route.geometry.length > 0) {
      setTruckPosition(route.geometry[0]);
    }
  };

  // Nettoyer les ressources lors du démontage du composant
  useEffect(() => {
    return () => {
      // Arrêter la simulation lors du démontage du composant
      if (isSimulating) {
        setIsSimulating(false);
        setIsMonitoringTest(false);
      }
      // Supprimer le marqueur si nécessaire
      if (truckMarker && map) {
        map.removeLayer(truckMarker);
      }
    };
  }, [isSimulating, truckMarker, map]);





  const testDeviation = () => {
    if (!route || !route.geometry || route.geometry.length === 0) return;
    
    // Générer une position aléatoire
    const randomIndex = Math.floor(Math.random() * route.geometry.length);
    const randomPoint = route.geometry[randomIndex];
    
    // Créer une position déviée
    const deviation = {
      lat: randomPoint[0] + (Math.random() - 0.5) * 0.001, // ±100m environ
      lng: randomPoint[1] + (Math.random() - 0.5) * 0.001
    };
    
    // Mettre à jour la position du camion
    setTruckPosition([deviation.lat, deviation.lng]);
    
    // Mettre à jour le marqueur
    if (truckMarker) {
      truckMarker.setLatLng([deviation.lat, deviation.lng]);
    }
    
    // Vérifier la déviation
    if (checkIfOffRoute) {
      const isOffRoute = checkIfOffRoute([deviation.lat, deviation.lng], route.geometry, map);
      console.log('Test de déviation:', isOffRoute ? 'Hors route' : 'Sur la route');
    }
  };

  const pointToLineDistance = useCallback((point, lineStart, lineEnd) => {
    // Calcul de la distance entre un point et un segment de ligne
    const x = point[0];
    const y = point[1];
    const x1 = lineStart[0];
    const y1 = lineStart[1];
    const x2 = lineEnd[0];
    const y2 = lineEnd[1];

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;

    return Math.sqrt(dx * dx + dy * dy) * 111000; // Conversion en mètres
  }, []);

  return (
    <div>
      <SimulationControls
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        isMonitoringTest={isMonitoringTest}
        setIsMonitoringTest={setIsMonitoringTest}
        onRecalculateRoute={onRecalculateRoute}
        onStartSimulation={startSimulation}
        onStopSimulation={stopSimulation}
        onTruckDrag={handleTruckDrag}
      />
      <button
        onClick={testDeviation}
        style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          marginLeft: '10px',
          marginTop: '10px'
        }}
      >
        Tester Ecart
      </button>

      {isMonitoringTest && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🎯</span>
            Mode Test Monitoring
          </div>
          <p style={{ margin: '5px 0' }}>
            <span style={{ fontWeight: 'bold' }}>📏 Distance max:</span> {deviationThreshold}m
          </p>
          <p style={{ margin: '5px 0', color: '#664d03' }}>
            <span role="img" aria-label="astuce">💡</span> Cliquez et déplacez le camion sur la carte pour tester le recalcul d'itinéraire
          </p>
        </div>
      )}

      <style jsx global>{`
        .truck-icon {
          font-size: 24px;
          text-align: center;
          line-height: 30px;
          cursor: grab;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          transition: transform 0.2s ease;
        }
        .truck-icon:hover {
          transform: scale(1.1);
        }
        .truck-icon:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
};

export default Simulation;