# ⚙️ TrackTruck Backend

## 🚀 Démarrage rapide
\`\`\`bash
npm install
cp .env.example .env
npm run populate
npm start
\`\`\`

## 📁 Structure
\`\`\`
backend/
├── routes/            # Endpoints API
│   ├── routes.js             # Calcul d'itinéraires
│   ├── drivers.js            # Authentification
│   └── suggestions.js        # Suggestions
├── utils/             # Algorithmes et utilitaires
│   ├── aStar.js              # Algorithme A*
│   ├── buildGraph.js         # Construction du graphe
│   ├── cacheRoutes.js        # Cache PostgreSQL
│   ├── fetchRoadData.js      # Données OSM
│   └── isPointInPolygon.js   # Géométrie
├── analyzeRisk.js     # Analyse des risques
├── trouverzone.js     # Gestion des zones
├── server.js          # Serveur principal
├── db.js              # Connexion PostgreSQL
├── remplissage.js     # Script de peuplement
└── fetch_data.js      # Import données OSM
\`\`\`

## 🗄️ Base de données
\`\`\`sql
-- Tables principales
cached_routes          # Cache des itinéraires
risk_zones             # Zones à risque
drivers                # Conducteurs
route_suggestions      # Suggestions
\`\`\`

## 🔧 Scripts
\`\`\`bash
npm start              # Démarrer le serveur
npm run dev            # Mode développement
npm run populate       # Peupler la base
npm run fetch-data     # Importer données OSM
\`\`\`

## 📊 APIs
- Port : 3001
- CORS : Activé pour localhost:3000
- Rate limiting : 100 req/15min
- Session : Express-session
