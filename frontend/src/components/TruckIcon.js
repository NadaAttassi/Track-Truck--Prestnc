"use client"

import L from "leaflet"

// 🚛 Créer une icône de camion réaliste avec animation
const createTruckIcon = (heading = 0, isMoving = false) => {
  const truckSvg = `
    <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${heading} 25 25)">
        <!-- Ombre du camion -->
        <ellipse cx="26" cy="42" rx="18" ry="4" fill="rgba(0,0,0,0.3)"/>
        
        <!-- Remorque -->
        <rect x="15" y="20" width="20" height="12" rx="2" fill="#2563eb" stroke="#1d4ed8" stroke-width="1"/>
        
        <!-- Cabine -->
        <rect x="10" y="18" width="10" height="10" rx="2" fill="#1d4ed8" stroke="#1e40af" stroke-width="1"/>
        
        <!-- Pare-brise -->
        <rect x="11" y="19" width="8" height="4" rx="1" fill="#87ceeb" stroke="#4682b4" stroke-width="0.5"/>
        
        <!-- Roues avant -->
        <circle cx="14" cy="30" r="3" fill="#2d3748" stroke="#1a202c" stroke-width="1"/>
        <circle cx="14" cy="30" r="1.5" fill="#4a5568"/>
        
        <!-- Roues arrière -->
        <circle cx="25" cy="30" r="3" fill="#2d3748" stroke="#1a202c" stroke-width="1"/>
        <circle cx="25" cy="30" r="1.5" fill="#4a5568"/>
        <circle cx="30" cy="30" r="3" fill="#2d3748" stroke="#1a202c" stroke-width="1"/>
        <circle cx="30" cy="30" r="1.5" fill="#4a5568"/>
        
        <!-- Phares -->
        <circle cx="8" cy="21" r="1.5" fill="#fbbf24" opacity="${isMoving ? "1" : "0.7"}"/>
        <circle cx="8" cy="25" r="1.5" fill="#fbbf24" opacity="${isMoving ? "1" : "0.7"}"/>
        
        <!-- Indicateur de direction -->
        <polygon points="38,25 42,23 42,27" fill="#ef4444"/>
        
        <!-- Détails de la cabine -->
        <rect x="11" y="24" width="2" height="3" rx="0.5" fill="#374151"/> <!-- Porte -->
        <rect x="15" y="24" width="2" height="3" rx="0.5" fill="#374151"/> <!-- Porte -->
        
        <!-- Grille avant -->
        <rect x="7" y="20" width="1" height="6" fill="#6b7280"/>
        <line x1="7.5" y1="21" x2="7.5" y2="25" stroke="#9ca3af" stroke-width="0.3"/>
        
        ${
          isMoving
            ? `
        <!-- Effet de mouvement -->
        <g opacity="0.6">
          <line x1="5" y1="32" x2="8" y2="32" stroke="#60a5fa" stroke-width="1" stroke-dasharray="2,1"/>
          <line x1="5" y1="34" x2="10" y2="34" stroke="#60a5fa" stroke-width="1" stroke-dasharray="3,1"/>
        </g>
        `
            : ""
        }
      </g>
    </svg>
  `

  return L.divIcon({
    html: truckSvg,
    className: "truck-marker-container",
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
  })
}

export { createTruckIcon }
