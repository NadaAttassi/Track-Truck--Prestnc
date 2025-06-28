const express = require('express');
const router = express.Router();
const pool = require('../db');
const fetchFromGeocoder = require('../utils/fetchFromGeocoder');

// Mapping des catégories vers les types
const categoryToTypes = {
  transport: ['aerodrome', 'airport', 'bus_station', 'bus_stop', 'train_station', 'tram_stop', 'parking', 'fuel', 'gas_station'],
  accommodation: ['hotel', 'tourism_guest_house', 'hostel', 'apartment'],
  food: ['restaurant', 'cafe', 'fast_food', 'bar', 'pub'],
  health: ['hospital', 'clinic', 'doctor', 'dentist', 'pharmacy'],
  shopping: ['shop', 'supermarket', 'mall', 'bakery', 'clothing', 'electronics_store'],
  tourism: ['tourist_attraction', 'museum', 'park', 'beach', 'castle'],
  education: ['school', 'university', 'library', 'language_school'],
  services: ['bank', 'post_office', 'police_station', 'pharmacy']
};

router.post('/', async (req, res) => {
  console.log('Requête reçue sur /api/suggestions:', req.body);
  
  let { query, category } = req.body;
  if (!query || typeof query !== 'string') {
    console.log('Requête /api/suggestions: query manquante ou invalide');
    return res.status(400).json({ error: 'Le paramètre query est requis et doit être une chaîne de caractères' });
  }

  query = query.trim().replace(/^"|"$/g, '');
  
  if (category && typeof category !== 'string') {
    console.log('Catégorie invalide:', category);
    return res.status(400).json({ error: 'Le paramètre category doit être une chaîne de caractères' });
  }

  try {
    console.log('Requête /api/suggestions:', query);

    // Step 1: Fetch suggestions from the database
    let sqlQuery = `
      SELECT name, type, city, lat, lon 
      FROM places 
      WHERE (name ILIKE $1 OR type ILIKE $1 OR city ILIKE $1)
    `;
    
    let values = [`%${query}%`];
    
    // Si une catégorie est spécifiée et valide, filtrer par types de cette catégorie
    if (category && categoryToTypes[category]) {
      const types = categoryToTypes[category];
      if (types && types.length > 0) {
        const placeholders = types.map((_, i) => `$${values.length + i + 1}`).join(',');
        sqlQuery += ` AND type IN (${placeholders})`;
        values = values.concat(types);
        console.log(`Filtrage des types pour la catégorie ${category}:`, types);
        console.log(`Requête SQL:`, sqlQuery);
        console.log(`Valeurs:`, values);
      } else {
        console.log(`Aucun type défini pour la catégorie: ${category}`);
      }
    }
    
    sqlQuery += ' LIMIT 15';
    const dbResult = await pool.query(sqlQuery, values);

    let suggestions = dbResult.rows.map(row => ({
      name: row.name,
      type: row.type,
      city: row.city,
      lat: parseFloat(row.lat),
      lon: parseFloat(row.lon),
      source: 'database' // Add source for debugging
    }));

    // Step 2: If no results from the database, query Photon and cache the results
    if (suggestions.length === 0) {
      console.log('Aucune suggestion dans la base de données, recherche via Photon:', query);
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=fr&bbox=-17.0,21.0,-1.0,36.0`;
      const photonResponse = await fetchFromGeocoder(photonUrl);
      const photonFeatures = photonResponse.data.features;

      const photonSuggestions = photonFeatures.map(feature => {
        const city = feature.properties.city || 'Unknown'; // Fallback if city is missing
        return {
          name: feature.properties.name || 'Unknown Place',
          type: feature.properties.osm_value || feature.properties.type || 'unknown',
          city: city,
          lat: feature.geometry.coordinates[1], // Latitude (Photon: [lon, lat])
          lon: feature.geometry.coordinates[0], // Longitude
          source: 'photon' // Add source for debugging
        };
      });

      // Cache Photon results in the database
      for (const suggestion of photonSuggestions) {
        try {
          await pool.query(
            'INSERT INTO places (name, lat, lon, type, city, osm_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (name, lat, lon) DO NOTHING',
            [suggestion.name, suggestion.lat, suggestion.lon, suggestion.type, suggestion.city, suggestion.osm_id]
          );
        } catch (error) {
          console.error(`Erreur lors de l'insertion de ${suggestion.name} dans la base de données:`, error.message);
        }
      }

      suggestions = photonSuggestions;
    }

    // Step 3: Remove the source field and return the suggestions
    const finalSuggestions = suggestions.map(({ source, ...rest }) => rest);

    console.log('Suggestions renvoyées:', finalSuggestions);
    res.json(finalSuggestions);
  } catch (error) {
    console.error('Erreur /api/suggestions:', error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des suggestions' });
  }
});

module.exports = router;
