# 🎨 TrackTruck Frontend

## 🚀 Démarrage rapide
\`\`\`bash
npm install
npm start
\`\`\`

## 📁 Structure
\`\`\`
src/
├── components/        # Composants réutilisables
│   ├── MapComponent.js       # Carte Leaflet
│   ├── RouteInfo.js          # Affichage des métriques
│   ├── SearchBar.js          # Recherche d'adresses
│   └── DirectionMarker.js    # Marqueurs directionnels
├── hooks/             # Hooks personnalisés
│   ├── useRoute.js           # Gestion des itinéraires
│   ├── useRiskAnalysis.js    # Analyse des risques
│   ├── useGeolocation.js     # Géolocalisation
│   └── useMonitoring.js      # Surveillance temps réel
├── pages/             # Pages principales
│   ├── OpenStreetMapPage.js  # Page principale
│   └── DriverLoginPage.js    # Page de connexion
├── utils/             # Utilitaires
│   ├── api.js                # Client API
│   ├── routeUtils.js         # Formatage des données
│   └── riskUtils.js          # Calculs de risque
└── assets/            # Images et styles
    ├── logo.png
    ├── trucks.png
    └── TruckAnimation.css
\`\`\`

## 🎯 Composants principaux

### MapComponent
- Affichage carte OpenStreetMap
- Tracé des itinéraires
- Marqueurs de zones à risque
- Géolocalisation temps réel

### RouteInfo  
- Métriques des 3 facteurs
- Sélection d'itinéraires
- Indicateur Safe Path
- Instructions détaillées

## 🔧 Configuration
- Port : 3000
- Proxy backend : 3001
- Build : `npm run build`
