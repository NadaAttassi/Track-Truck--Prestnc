import { getPlaceLabel } from '../utils/placeTypes';

// Mapping des types de lieux vers des emojis
const placeTypeToEmoji = {
  // Administratif
  administrative: '🏛️',
  
  // Commerces et services
  shop: '🛍️',
  supermarket: '🛒',
  mall: '🏬',
  convenience: '🏪',
  bakery: '🥖',
  butcher: '🥩',
  clothes: '👕',
  clothing: '👕',
  shoes: '👟',
  bank: '🏦',
  post_office: '📮',
  beauty_salon: '💇',
  hair_salon: '💇',
  hairdresser: '💇',
  bookstore: '📚',
  books: '📚',
  car_dealership: '🚗',
  car_parts: '🔧',
  auto_parts: '🔧',
  electronics_store: '📱',
  mobile_phone: '📱',
  phone: '📱',
  furniture_store: '🛋️',
  grocery_store: '🛒',
  grocery: '🛒',
  hardware_store: '🔨',
  hardware: '🔨',
  market: '🛒',
  pharmacy: '💊',
  services: '🛠️',
  beauty: '💄',
  
  // Restauration
  restaurant: '🍽️',
  cafe: '☕',
  'cafe;pharmacy': '☕💊',
  fast_food: '🍔',
  bar: '🍻',
  pub: '🍺',
  
  // Transports
  aerodrome: '✈️',
  airport: '✈️',
  bus_station: '🚌',
  bus_stop: '🚏',
  train_station: '🚉',
  tram_stop: '🚊',
  parking: '🅿️',
  parking_entrance: '🚪',
  parking_space: '🅿️',
  fuel: '⛽',
  gas_station: '⛽',
  station: '🚉',
  stop: '🚏',
  
  // Hébergement
  hotel: '🏨',
  tourism_guest_house: '🏠',  // Chambre d'hôtes - icône de maison plus visible
  guest_house: '🏠',         // Alias pour chambre d'hôtes
  'tourism_guest_house;hotel': '🏨',
  'tourism_camp_site;hotel': '⛺',
  hostel: '🛏️',
  apartment: '🏢',
  bed_and_breakfast: '🛌',  // Alternative pour chambre d'hôtes
  
  // Tourisme & Loisirs
  tourist_attraction: '🏛️',
  attraction: '🏛️',
  beach: '🏖️',
  castle: '🏰',
  cinema: '🎬',
  fountain: '⛲',
  golf_course: '⛳',
  memorial: '🪦',
  monument: '🗿',
  museum: '🏛️',
  park: '🌳',
  stadium: '🏟️',
  theater: '🎭',
  theatre: '🎭',
  information: 'ℹ️',
  tourist_info: 'ℹ️',
  
  // Éducation
  school: '🏫',
  college: '🎓',
  university: '🎓',
  library: '📚',
  kindergarten: '👶',
  educational_institution: '🏫',
  language_school: '🌐',
  music_school: '🎵',
  prep_school: '📚',
  
  // Santé
  hospital: '🏥',
  clinic: '🏥',
  doctor: '👨⚕️',
  dentist: '🦷',
  pharmacy: '💊',
  
  // Lieux de culte
  place_of_worship: '🛐',
  church: '⛪',
  mosque: '🕌',
  synagogue: '🕍',
  
  // Lieux historiques
  historic: '🏛️',
  historic_archaeological_site: '🏺',
  historic_battlefield: '⚔️',
  historic_building: '🏛️',
  historic_church: '⛪',
  historic_city: '🏙️',
  historic_city_gate: '🏛️',
  historic_citywalls: '🏰',
  historic_fort: '🏰',
  historic_gate: '🚪',
  historic_manor: '🏰',
  historic_technical_monument: '⚙️',
  historic_wayside_cross: '✝️',
  historic_yes: '🏛️',
  ruins: '🏚️',
  
  // Autres
  community_centre: '👥',
  industrial: '🏭',
  internet_cafe: '💻',
  police_station: '👮',
  residential: '🏠',
  shop_art: '🎨',
  telephone: '📞',
  tourism_info: 'ℹ️',
  towing: '🚛',
  
  // Par défaut
  default: '📍'
};

const PlaceDetails = ({ placeDetails, showDetails, expandedCard, toggleCard, handleDirectionsClick, isCalculatingRoute, showRouteInfo }) => {
  if (!placeDetails || !showDetails) return null;

  // Récupérer l'emoji en fonction du type de lieu
  const getPlaceEmoji = () => {
    // Vérifier d'abord les types spécifiques
    const specificTypes = [
      placeDetails.shop,
      placeDetails.tourism,
      placeDetails.amenity,
      placeDetails.historic,
      placeDetails.aeroway,
      placeDetails.leisure,
      placeDetails.office,
      placeDetails.landuse
    ].filter(Boolean);
    
    for (const type of specificTypes) {
      if (placeTypeToEmoji[type]) {
        return placeTypeToEmoji[type];
      }
    }
    
    // Vérifier les propriétés directes
    for (const [key, value] of Object.entries(placeDetails)) {
      if (key.startsWith('historic_') || key.endsWith('_station') || key.endsWith('_stop')) {
        if (placeTypeToEmoji[value]) {
          return placeTypeToEmoji[value];
        }
      }
    }
    
    // Vérifier le type direct
    if (placeDetails.type) {
      const type = placeDetails.type.replace('tourism_', ''); // Enlever le préfixe si présent
      if (placeTypeToEmoji[type]) {
        return placeTypeToEmoji[type];
      }
    }
    
    // Vérifier le nom de la catégorie
    if (placeDetails.category && placeTypeToEmoji[placeDetails.category]) {
      return placeTypeToEmoji[placeDetails.category];
    }
    
    return placeTypeToEmoji.default;
  };

  // Récupérer le libellé du type de lieu en utilisant le même mapping que SearchBar.js
  const getPlaceTypeLabel = () => {
    // Mapping des types de lieux avec leurs libellés (identique à SearchBar.js)
    const placeTypeLabels = {
      // Administratif
      administrative: 'Administratif',
      
      // Commerces et services
      shop: 'Magasin',
      supermarket: 'Supermarché',
      mall: 'Centre commercial',
      convenience: 'Épicerie de proximité',
      bakery: 'Boulangerie',
      butcher: 'Boucherie',
      clothes: 'Vêtements',
      bank: 'Banque',
      post_office: 'Bureau de poste',
      beauty_salon: 'Institut de beauté',
      bookstore: 'Librairie',
      car_dealership: 'Concessionnaire',
      electronics_store: 'Magasin d\'électronique',
      furniture_store: 'Magasin de meubles',
      grocery_store: 'Épicerie',
      hardware_store: 'Quincaillerie',
      market: 'Marché',
      pharmacy: 'Pharmacie',
      services: 'Services',
      
      // Restauration
      restaurant: 'Restaurant',
      cafe: 'Café',
      fast_food: 'Restauration rapide',
      bar: 'Bar',
      pub: 'Pub',
      
      // Transports
      aerodrome: 'Aérodrome',
      bus_station: 'Gare routière',
      bus_stop: 'Arrêt de bus',
      train_station: 'Gare ferroviaire',
      tram_stop: 'Arrêt de tram',
      airport: 'Aéroport',
      parking: 'Parking',
      parking_entrance: 'Entrée parking',
      parking_space: 'Place de parking',
      fuel: 'Station essence',
      gas_station: 'Station essence',
      station: 'Gare',
      stop: 'Arrêt',
      
      // Hébergement
      hotel: 'Hôtel',
      'tourism_guest_house': 'Chambre d\'hôtes',
      'tourism_guest_house;hotel': 'Chambre d\'hôtes/Hôtel',
      'tourism_camp_site;hotel': 'Camping/Hôtel',
      hostel: 'Auberge de jeunesse',
      
      // Tourisme & Loisirs
      tourist_attraction: 'Attraction touristique',
      beach: 'Plage',
      castle: 'Château',
      cinema: 'Cinéma',
      fountain: 'Fontaine',
      golf_course: 'Terrain de golf',
      memorial: 'Mémorial',
      monument: 'Monument',
      museum: 'Musée',
      park: 'Parc',
      stadium: 'Stade',
      theater: 'Théâtre',
      theatre: 'Théâtre',
      
      // Éducation
      school: 'École',
      college: 'Collège',
      university: 'Université',
      library: 'Bibliothèque',
      kindergarten: 'École maternelle',
      educational_institution: 'Établissement scolaire',
      language_school: 'École de langues',
      music_school: 'École de musique',
      prep_school: 'École préparatoire',
      
      // Santé
      hospital: 'Hôpital',
      doctor: 'Médecin',
      dentist: 'Dentiste',
      
      // Lieux historiques
      historic: 'Site historique',
      historic_archaeological_site: 'Site archéologique',
      historic_battlefield: 'Champ de bataille',
      historic_building: 'Bâtiment historique',
      historic_church: 'Église historique',
      historic_city: 'Ville historique',
      historic_city_gate: 'Porte de ville',
      historic_citywalls: 'Remparts',
      historic_fort: 'Fort',
      historic_gate: 'Porte',
      historic_manor: 'Manoir',
      historic_technical_monument: 'Monument technique',
      historic_wayside_cross: 'Croix de chemin',
      historic_yes: 'Site historique',
      ruins: 'Ruines',
      
      // Autres
      community_centre: 'Centre communautaire',
      industrial: 'Zone industrielle',
      internet_cafe: 'Cybercafé',
      police_station: 'Commissariat',
      residential: 'Résidentiel',
      shop_art: 'Magasin d\'art',
      telephone: 'Téléphone',
      tourism_info: 'Office de tourisme',
      towing: 'Dépannage',
      
      // Par défaut
      default: 'Lieu'
    };

    // Essayer de trouver le libellé en fonction du type de lieu
    const type = placeDetails.type || '';
    if (placeTypeLabels[type]) {
      return placeTypeLabels[type];
    }
    
    // Vérifier les catégories communes
    const categories = ['shop', 'tourism', 'amenity', 'historic', 'aeroway', 'leisure'];
    for (const category of categories) {
      if (placeDetails[category] && placeTypeLabels[`${category}_${placeDetails[category]}`]) {
        return placeTypeLabels[`${category}_${placeDetails[category]}`];
      }
      if (placeDetails[category] && placeTypeLabels[placeDetails[category]]) {
        return placeTypeLabels[placeDetails[category]];
      }
    }
    
    // Vérifier les propriétés directes
    for (const [key, value] of Object.entries(placeDetails)) {
      if (placeTypeLabels[value]) {
        return placeTypeLabels[value];
      }
      if (key.startsWith('tourism_') && placeTypeLabels[value]) {
        return placeTypeLabels[value];
      }
    }
    
    return placeTypeLabels.default;
  };

  const emoji = getPlaceEmoji();
  const label = getPlaceTypeLabel();
  const isExpanded = expandedCard === 'place';
  
  return (
    <div 
      className="place-details-container"
      style={{
        position: "fixed",
        top: "0",
        right: "0",
        width: isExpanded ? "250px" : "40px",
        height: "180px",
        background: "#fff",
        borderRadius: "0 0 0 10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 998,
        display: "flex",
        transition: "all 0.3s ease",
        overflow: "hidden",
        marginBottom: "10px"
      }}
    >
      {/* Header vertical */}
      <div
        onClick={() => toggleCard('place')}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "40px",
          height: "100%",
          background: "linear-gradient(180deg, #0056b3, #dc3545)",
          cursor: "pointer",
          fontWeight: "500",
          fontSize: "14px",
          color: "#fff",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          padding: "15px 5px",
          flexShrink: 0
        }}
      >
        <span style={{
          transform: "rotate(180deg)",
          whiteSpace: "nowrap",
          marginBottom: "10px",
          fontSize: "13px"
        }}>Déstination</span>
        <span style={{ 
          fontSize: "14px", 
          transform: "rotate(180deg)",
          fontWeight: "bold"
        }}>{isExpanded ? "◄" : "►"}</span>
      </div>

      {/* Contenu */}
      <div style={{ 
        padding: "15px", 
        flex: 1,
        overflowY: "auto",
        display: isExpanded ? "flex" : "none",
        flexDirection: "column",
        gap: "12px"
      }}>
        {/* En-tête avec emoji et nom */}
        <div style={{ 
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          paddingBottom: "10px",
          borderBottom: "1px solid #f0f0f0"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "#f0f7ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
          }}>
            {emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ 
              margin: "0 0 2px 0",
              fontSize: "16px",
              color: "#1a1a1a",
              fontWeight: "600",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {placeDetails.name || "Destination personnalisée"}
            </h3>
            <p style={{ 
              margin: "0",
              fontSize: "13px",
              color: "#4a6cf7",
              fontWeight: "500"
            }}>
              {label}
            </p>
          </div>
        </div>


        {/* Coordonnées compactes */}
        <div style={{
          backgroundColor: "#f8f9fa",
          padding: "8px 10px",
          borderRadius: "6px",
          border: "1px solid #e9ecef",
          fontSize: "12px",
          color: "#495057"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span>Lat: <span style={{ fontFamily: "monospace" }}>{Number(placeDetails.lat).toFixed(6)}</span></span>
            <span style={{ color: "#dee2e6" }}>|</span>
            <span>Lon: <span style={{ fontFamily: "monospace" }}>{Number(placeDetails.lon).toFixed(6)}</span></span>
          </div>
        </div>

        {/* Bouton d'action principal */}
        <button
          onClick={handleDirectionsClick}
          disabled={isCalculatingRoute}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: showRouteInfo ? "#dc3545" : "#007bff",
            background: showRouteInfo 
              ? "linear-gradient(135deg, #dc3545, #c82333)" 
              : "linear-gradient(135deg, #007bff, #0056b3)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isCalculatingRoute ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.2s ease",
            opacity: isCalculatingRoute ? 0.8 : 1,
            marginTop: "auto",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            position: "relative",
            overflow: "hidden"
          }}
          onMouseOver={e => {
            if (!isCalculatingRoute) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
            }
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
          }}
          onMouseDown={e => {
            if (!isCalculatingRoute) {
              e.currentTarget.style.transform = "translateY(1px)";
            }
          }}
          onMouseUp={e => {
            if (!isCalculatingRoute) {
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
        >
          <span style={{
            fontSize: "16px",
            transition: "transform 0.2s ease"
          }}>
            {showRouteInfo ? "🚫" : "🚗"}
          </span>
          <span>
            {isCalculatingRoute 
              ? "Calcul en cours..." 
              : showRouteInfo 
                ? "Masquer l'itinéraire" 
                : "Itinéraire"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default PlaceDetails;