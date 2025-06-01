"use client"

import { useState, useEffect } from 'react';
import SimulationControls from './SimulationControls';
import L from 'leaflet';

const Simulation = ({ route, onRecalculateRoute, map }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [truckPosition, setTruckPosition] = useState(null);
  const [isMonitoringTest, setIsMonitoringTest] = useState(false);
  const [deviationThreshold] = useState(50); // mètres
  const [truckMarker, setTruckMarker] = useState(null);

  useEffect(() => {
    if (!route || !route.geometry || route.geometry.length === 0) return;
    // Initialiser la position du camion au début de la route
    const startPosition = route.geometry[0];
    setTruckPosition(startPosition);
    
    // Créer ou mettre à jour le marqueur du camion
    if (map && startPosition) {
      if (truckMarker) {
        truckMarker.setLatLng(startPosition);
      } else {
        const marker = L.marker(startPosition, {
          icon: L.divIcon({
            className: 'truck-icon',
            html: '🚛',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          }),
          draggable: isMonitoringTest
        });

        marker.addTo(map);
        setTruckMarker(marker);

        // Gestionnaire d'événements pour le début du glissement
        marker.on('dragstart', () => {
          if (!isMonitoringTest) return;
          marker.getElement().style.cursor = 'grabbing';
          marker.setIcon(L.divIcon({
            className: 'truck-icon dragging',
            html: '🚛',
            iconSize: [35, 35], // Légèrement plus grand pendant le glissement
            iconAnchor: [17.5, 17.5]
          }));
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
          marker.setIcon(L.divIcon({
            className: 'truck-icon',
            html: '🚛',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          }));
          const newPos = e.target.getLatLng();
          handleTruckDrag([newPos.lat, newPos.lng]);
        });
      }
    }

    return () => {
      if (map && truckMarker) {
        truckMarker.remove();
      }
    };
  }, [route, map, isMonitoringTest]);

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
      truckMarker.setIcon(L.divIcon({
        className: `truck-icon ${isMonitoringTest ? 'movable' : ''}`,
        html: isMonitoringTest ? '🚛' : '🚚',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }));
    }
  }, [truckPosition, isMonitoringTest]);

  const startSimulation = () => {
    setIsSimulating(true);
    if (route && route.geometry && route.geometry.length > 0) {
      setTruckPosition(route.geometry[0]);
    }
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setIsMonitoringTest(false);
  };

  const handleTruckDrag = (newPosition) => {
    if (!isMonitoringTest) return;

    setTruckPosition(newPosition);
    
    // Calculer la déviation par rapport à la route
    const deviation = calculateDeviation(newPosition, route.geometry);
    
    if (deviation > deviationThreshold) {
      console.log(`🚨 Déviation détectée: ${deviation.toFixed(2)}m`);
      // Recalculer l'itinéraire depuis la nouvelle position
      onRecalculateRoute(newPosition);
    }
  };

  const calculateDeviation = (position, routeGeometry) => {
    // Trouver le point le plus proche sur la route
    let minDistance = Infinity;
    
    for (let i = 0; i < routeGeometry.length - 1; i++) {
      const pointA = routeGeometry[i];
      const pointB = routeGeometry[i + 1];
      const distance = pointToLineDistance(position, pointA, pointB);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  };

  const pointToLineDistance = (point, lineStart, lineEnd) => {
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
  };

  return (
    <>
      <SimulationControls
        isSimulating={isSimulating}
        onStartSimulation={startSimulation}
        onStopSimulation={stopSimulation}
        onToggleMonitoringTest={setIsMonitoringTest}
        isMonitoringTest={isMonitoringTest}
        onTruckDrag={handleTruckDrag}
      />
      
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
            <span>💡</span> Cliquez et déplacez le camion (🚛) sur la carte pour tester le recalcul d'itinéraire
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
    </>
  );
};

export default Simulation; 