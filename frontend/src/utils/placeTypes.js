// Mapping complet des types de lieux avec emojis et libellés en français
export const placeTypeMapping = {
  shop: {
    supermarket: { label: 'Supermarché', icon: '🛒' },
    convenience: { label: 'Épicerie', icon: '🥦' },
    grocery: { label: 'Épicerie', icon: '🥦' },
    bakery: { label: 'Boulangerie', icon: '🥖' },
    butcher: { label: 'Boucherie', icon: '🥩' },
    clothes: { label: 'Vêtements', icon: '👕' },
    clothing: { label: 'Vêtements', icon: '👕' },
    shoes: { label: 'Chaussures', icon: '👟' },
    electronics: { label: 'Électronique', icon: '📱' },
    mobile_phone: { label: 'Téléphonie', icon: '📱' },
    phone: { label: 'Téléphonie', icon: '📱' },
    car: { label: 'Concessionnaire', icon: '🚗' },
    car_parts: { label: 'Pièces auto', icon: '🔧' },
    auto_parts: { label: 'Pièces auto', icon: '🔧' },
    hardware: { label: 'Quincaillerie', icon: '🔨' },
    furniture: { label: 'Meubles', icon: '🛋️' },
    books: { label: 'Librairie', icon: '📚' },
    bookstore: { label: 'Librairie', icon: '📚' },
    beauty: { label: 'Beauté', icon: '💄' },
    beauty_salon: { label: 'Institut de beauté', icon: '💄' },
    hairdresser: { label: 'Coiffeur', icon: '💇' },
    hair_salon: { label: 'Salon de coiffure', icon: '💇' },
    default: { label: 'Commerce', icon: '🏪' }
  },
  tourism: {
    hotel: { label: 'Hôtel', icon: '🏨' },
    guest_house: { label: 'Chambre d\'hôtes', icon: '🏡' },
    hostel: { label: 'Auberge de jeunesse', icon: '🛏️' },
    apartment: { label: 'Appartement', icon: '🏢' },
    museum: { label: 'Musée', icon: '🏛️' },
    attraction: { label: 'Attraction', icon: '🎡' },
    tourist_attraction: { label: 'Attraction touristique', icon: '🎡' },
    information: { label: 'Information', icon: 'ℹ️' },
    tourist_info: { label: 'Information touristique', icon: 'ℹ️' },
    default: { label: 'Tourisme', icon: '🗺️' }
  },
  amenity: {
    restaurant: { label: 'Restaurant', icon: '🍽️' },
    cafe: { label: 'Café', icon: '☕' },
    fast_food: { label: 'Fast-food', icon: '🍔' },
    bar: { label: 'Bar', icon: '🍻' },
    hospital: { label: 'Hôpital', icon: '🏥' },
    clinic: { label: 'Clinique', icon: '🏥' },
    pharmacy: { label: 'Pharmacie', icon: '💊' },
    school: { label: 'École', icon: '🏫' },
    university: { label: 'Université', icon: '🎓' },
    library: { label: 'Bibliothèque', icon: '📚' },
    bank: { label: 'Banque', icon: '🏦' },
    atm: { label: 'Distributeur', icon: '🏧' },
    post_office: { label: 'Bureau de poste', icon: '📮' },
    police: { label: 'Commissariat', icon: '👮' },
    police_station: { label: 'Commissariat', icon: '👮' },
    mosque: { label: 'Mosquée', icon: '🕌' },
    place_of_worship: { label: 'Lieu de culte', icon: '⛪' },
    religious_site: { label: 'Lieu de culte', icon: '⛪' },
    parking: { label: 'Parking', icon: '🅿️' },
    fuel: { label: 'Station-service', icon: '⛽' },
    gas_station: { label: 'Station-service', icon: '⛽' },
    marketplace: { label: 'Marché', icon: '🛍️' },
    market: { label: 'Marché', icon: '🛍️' },
    theatre: { label: 'Théâtre', icon: '🎭' },
    theater: { label: 'Théâtre', icon: '🎭' },
    cinema: { label: 'Cinéma', icon: '🎬' },
    default: { label: 'Service', icon: '🏢' }
  },
  historic: {
    monument: { label: 'Monument', icon: '🗿' },
    ruins: { label: 'Ruines', icon: '🏚️' },
    castle: { label: 'Château', icon: '🏰' },
    memorial: { label: 'Mémorial', icon: '🕯️' },
    archaeological_site: { label: 'Site archéologique', icon: '🏺' },
    tomb: { label: 'Tombe', icon: '⚰️' },
    wayside_shrine: { label: 'Sanctuaire', icon: '⛩️' },
    shrine: { label: 'Sanctuaire', icon: '⛩️' },
    default: { label: 'Site historique', icon: '🏛️' }
  },
  aeroway: {
    aerodrome: { label: 'Aérodrome', icon: '✈️' },
    heliport: { label: 'Héliport', icon: '🚁' },
    airport: { label: 'Aéroport', icon: '✈️' },
    default: { label: 'Transport aérien', icon: '✈️' }
  },
  default: {
    default: { label: 'Lieu', icon: '📍' }
  }
};

/**
 * Obtient les informations d'affichage pour un type de lieu
 * @param {string} category - Catégorie du lieu (ex: 'shop', 'tourism')
 * @param {string} type - Type spécifique du lieu (ex: 'supermarket', 'hotel')
 * @returns {Object} - Objet contenant le label et l'icône
 */
export function getPlaceTypeInfo(category, type) {
  // Vérifier si la catégorie existe
  const categoryData = placeTypeMapping[category] || placeTypeMapping.default;
  
  // Vérifier si le type spécifique existe, sinon utiliser le type par défaut
  const typeInfo = categoryData[type] || categoryData.default || placeTypeMapping.default.default;
  
  return {
    label: typeInfo.label,
    icon: typeInfo.icon
  };
}

/**
 * Obtient l'icône Material Icons pour un type de lieu
 * @param {string} category - Catégorie du lieu
 * @param {string} type - Type spécifique du lieu
 * @returns {string} - Nom de l'icône Material Icons
 */
export function getPlaceIcon(category, type) {
  return getPlaceTypeInfo(category, type).icon;
}

/**
 * Obtient le libellé en français pour un type de lieu
 * @param {string} category - Catégorie du lieu
 * @param {string} type - Type spécifique du lieu
 * @returns {string} - Libellé en français
 */
export function getPlaceLabel(category, type) {
  return getPlaceTypeInfo(category, type).label;
}

/**
 * Trouve la catégorie et le label simplifié à partir d'un type brut (ex: 'cafe', 'gas_station')
 * @param {string} rawType
 * @returns {{category: string, label: string, icon: string}}
 */
export function getPlaceInfoFromRawType(rawType) {
  for (const category of Object.keys(placeTypeMapping)) {
    const types = placeTypeMapping[category];
    if (types[rawType]) {
      return {
        category,
        label: types[rawType].label,
        icon: types[rawType].icon
      };
    }
  }
  // fallback
  return {
    category: 'default',
    label: placeTypeMapping.default.default.label,
    icon: placeTypeMapping.default.default.icon
  };
}
