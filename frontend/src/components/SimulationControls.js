"use client"

import { useState } from 'react';

const SimulationControls = ({ 
  isSimulating,
  onStartSimulation,
  onStopSimulation,
  onToggleMonitoringTest,
  isMonitoringTest,
  onTruckDrag,
  speed,
  onSpeedChange,
  progress
}) => {
  const [showConfig, setShowConfig] = useState(false);

  const handleStopClick = () => {
    onStopSimulation();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '15px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
      zIndex: 1000,
      maxWidth: '90%',
      width: 'auto'
    }}>
      {isSimulating && (
        <>
          {/* Contrôle de vitesse */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <span style={{ fontSize: '14px', color: '#6c757d' }}>🚗 Vitesse:</span>
            <select
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #dee2e6',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
            </select>
          </div>

          {/* Barre de progression */}
          <div style={{
            flex: 1,
            minWidth: '150px',
            height: '30px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #dee2e6',
            position: 'relative'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }}/>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: progress > 50 ? '#fff' : '#666',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {progress}%
            </div>
          </div>

          {/* Bouton d'arrêt */}
          <button
            onClick={handleStopClick}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '120px',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <span>⏹️</span>
            <span>Arrêter</span>
          </button>
        </>
      )}
    </div>
  );
};

export default SimulationControls; 