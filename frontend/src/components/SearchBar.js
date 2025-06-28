"use client"

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { haversineDistance, formatDistance, estimateTime, formatTime } from '../utils/routeUtils';
import { getPlaceInfoFromRawType } from '../utils/placeTypes';
import styles from './SearchBar.module.css';

// Import des icônes FontAwesome
import { 
  // Icônes de base
  faFilter, faMapPin, faInfo, faInfoCircle, faChevronRight, faChevronLeft, faChevronDown, faChevronUp,
  faEnvelope, faBook, faTshirt, faCouch, faTv, faSpa, faShoppingBasket,
  faShieldAlt, faFireExtinguisher, faPray, faCross, faFlag, faChessRook, faFilm, 
  faGolfBallTee, faMonument, faTheaterMasks, faUniversity, faBookReader, faChild,
  faPlaceOfWorship, faChurch, faMosque, faSynagogue, faArchway, faIndustry, 
  faLaptop, faTruckPickup, faRoute,
  
  // Transports
  faPlane, faBus, faTrain, faTram, faSubway, faCar, faTaxi, 
  faBicycle, faMotorcycle, faShip, faHelicopter,
  faGasPump, faParking, faRoad, faSignInAlt,
  
  // Hébergement
  faHotel, faBed, faHouse, faHome, faBuildingColumns,
  
  // Nourriture et boissons
  faUtensils, faHamburger, faPizzaSlice, faBreadSlice, faMugHot, faWineGlass,
  faGlassCheers, faBeer, faCoffee,
  
  // Santé
  faHospital, faUserDoctor, faStethoscope, faHeartPulse, faPills, faSyringe,
  faBriefcaseMedical, faHeart,
  
  // Éducation
  faGraduationCap, faSchool, faUserGraduate,
  
  // Autres icônes
  faBuilding, faMapMarkerAlt, faClock, faSearch, faTimes, faShoppingCart, faTools,
  faStore, faStoreAlt, faShop, faUmbrellaBeach, faWater, faFutbol, faMountain,
  faPalette, faMobileAlt, faMusic, faTooth, faCampground, faSoccerBall,
  faLandmark, faCity, faTree, faCamera, faPhone, faFire, faCarrot, faUsers,
  faSquare, faLanguage,
  
  // Icônes pour types de lieux spécifiques
  faPaw, faTrophy, faFish
} from '@fortawesome/free-solid-svg-icons';

// Mapping complet des types de lieux avec icônes FontAwesome et libellés de PlaceDetails
const placeTypeMapping = {
  // Administratif
  administrative: { label: 'Administratif', icon: faBuilding, color: '#3F51B5' },
  
  // Commerces et services
  shop: { label: 'Magasin', icon: faShoppingCart, color: '#4CAF50' },
  supermarket: { label: 'Supermarché', icon: faShoppingCart, color: '#4CAF50' },
  mall: { label: 'Centre commercial', icon: faStore, color: '#4CAF50' },
  convenience: { label: 'Épicerie de proximité', icon: faStoreAlt, color: '#4CAF50' },
  bakery: { label: 'Boulangerie', icon: faBreadSlice, color: '#795548' },
  butcher: { label: 'Boucherie', icon: faUtensils, color: '#F44336' },
  clothes: { label: 'Vêtements', icon: faTshirt, color: '#2196F3' },
  clothing_store: { label: 'Vêtements', icon: faTshirt, color: '#2196F3' },
  bank: { label: 'Banque', icon: faBuilding, color: '#3F51B5' },
  post_office: { label: 'Bureau de poste', icon: faEnvelope, color: '#FF5722' },
  beauty_salon: { label: 'Institut de beauté', icon: faPalette, color: '#E91E63' },
  bookstore: { label: 'Librairie', icon: faBook, color: '#795548' },
  car_dealership: { label: 'Concessionnaire', icon: faCar, color: '#607D8B' },
  electronics_store: { label: 'Magasin d\'électronique', icon: faMobileAlt, color: '#2196F3' },
  furniture_store: { label: 'Magasin de meubles', icon: faCouch, color: '#795548' },
  grocery_store: { label: 'Épicerie', icon: faShoppingCart, color: '#4CAF50' },
  hardware_store: { label: 'Quincaillerie', icon: faTools, color: '#795548' },
  market: { label: 'Marché', icon: faShoppingCart, color: '#4CAF50' },
  pharmacy: { label: 'Pharmacie', icon: faPills, color: '#E91E63' },
  services: { label: 'Services', icon: faTools, color: '#607D8B' },
  shop_art: { label: 'Magasin d\'art', icon: faPalette, color: '#9C27B0' },
  
  // Hébergement
  hotel: { label: 'Hôtel', icon: faHotel, color: '#E91E63' },
  tourism_guest_house: { label: 'Chambre d\'hôtes', icon: faBed, color: '#9C27B0' },
  tourism_camp_site: { label: 'Camping', icon: faCampground, color: '#4CAF50' },
  tourism_apartment: { label: 'Appartement', icon: faHome, color: '#FF9800' },
  hostel: { label: 'Auberge de jeunesse', icon: faBed, color: '#9C27B0' },
  
  // Tourisme & Loisirs
  tourist_attraction: { label: 'Attraction touristique', icon: faCamera, color: '#2196F3' },
  museum: { label: 'Musée', icon: faLandmark, color: '#3F51B5' },
  art_gallery: { label: 'Galerie d\'art', icon: faPalette, color: '#9C27B0' },
  park: { label: 'Parc', icon: faTree, color: '#4CAF50' },
  zoo: { label: 'Zoo', icon: faPaw, color: '#FF9800' },
  amusement_park: { label: 'Parc d\'attractions', icon: faTrophy, color: '#E91E63' },
  aquarium: { label: 'Aquarium', icon: faFish, color: '#00BCD4' },
  
  // Éducation
  school: { label: 'École', icon: faSchool, color: '#3F51B5' },
  university: { label: 'Université', icon: faGraduationCap, color: '#3F51B5' },
  library: { label: 'Bibliothèque', icon: faBook, color: '#795548' },
  
  // Santé
  hospital: { label: 'Hôpital', icon: faHospital, color: '#E91E63' },
  doctor: { label: 'Médecin', icon: faUserDoctor, color: '#2196F3' },
  pharmacy: { label: 'Pharmacie', icon: faPills, color: '#4CAF50' },
  dentist: { label: 'Dentiste', icon: faTooth, color: '#00BCD4' },
  
  // Transports
  bus_station: { label: 'Gare routière', icon: faBus, color: '#1976D2' },
  train_station: { label: 'Gare', icon: faTrain, color: '#1976D2' },
  airport: { label: 'Aéroport', icon: faPlane, color: '#1976D2' },
  taxi_stand: { label: 'Station de taxi', icon: faTaxi, color: '#FFC107' },
  
  // Alimentation
  restaurant: { label: 'Restaurant', icon: faUtensils, color: '#F44336' },
  cafe: { label: 'Café', icon: faCoffee, color: '#795548' },
  bar: { label: 'Bar', icon: faGlassCheers, color: '#9C27B0' },
  bakery: { label: 'Boulangerie', icon: faBreadSlice, color: '#795548' },
  
  // Services
  police: { label: 'Commissariat', icon: faShieldAlt, color: '#3F51B5' },
  fire_station: { label: 'Caserne de pompiers', icon: faFireExtinguisher, color: '#F44336' },
  
  // Lieux de culte et autres
  place_of_worship: { label: 'Lieu de culte', icon: faPray, color: '#9C27B0' },
  cemetery: { label: 'Cimetière', icon: faCross, color: '#607D8B' },
  city_hall: { label: 'Mairie', icon: faLandmark, color: '#3F51B5' },
  embassy: { label: 'Ambassade', icon: faFlag, color: '#F44336' },
  
  // Transports
  aerodrome: { label: 'Aérodrome', icon: faPlane, color: '#1976D2' },
  airport: { label: 'Aéroport', icon: faPlane, color: '#1976D2' },
  bus_station: { label: 'Gare routière', icon: faBus, color: '#1976D2' },
  bus_stop: { label: 'Arrêt de bus', icon: faBus, color: '#1976D2' },
  train_station: { label: 'Gare ferroviaire', icon: faTrain, color: '#1976D2' },
  tram_stop: { label: 'Arrêt de tram', icon: faTram, color: '#1976D2' },
  parking: { label: 'Parking', icon: faParking, color: '#607D8B' },
  parking_entrance: { label: 'Entrée de parking', icon: faSignInAlt, color: '#607D8B' },
  parking_space: { label: 'Place de parking', icon: faSquare, color: '#607D8B' },
  fuel: { label: 'Station essence', icon: faGasPump, color: '#FF9800' },
  gas_station: { label: 'Station-service', icon: faGasPump, color: '#FF9800' },
  station: { label: 'Gare', icon: faTrain, color: '#1976D2' },
  stop: { label: 'Arrêt', icon: faBus, color: '#1976D2' },
  
  // Hébergement
  hostel: { label: 'Auberge de jeunesse', icon: faBed, color: 'blue' },
  
  // Tourisme & Loisirs
  tourist_attraction: { label: 'Attraction touristique', icon: faCamera, color: 'blue' },
  beach: { label: 'Plage', icon: faUmbrellaBeach, color: 'blue' },
  castle: { label: 'Château', icon: faChessRook, color: 'blue' },
  cinema: { label: 'Cinéma', icon: faFilm, color: 'blue' },
  fountain: { label: 'Fontaine', icon: faWater, color: 'blue' },
  golf_course: { label: 'Terrain de golf', icon: faGolfBallTee, color: 'blue' },
  memorial: { label: 'Mémorial', icon: faMonument, color: 'blue' },
  monument: { label: 'Monument', icon: faMonument, color: 'blue' },
  museum: { label: 'Musée', icon: faLandmark, color: 'blue' },
  park: { label: 'Parc', icon: faTree, color: 'blue' },
  stadium: { label: 'Stade', icon: faSoccerBall, color: 'blue' },
  theater: { label: 'Théâtre', icon: faTheaterMasks, color: 'blue' },
  theatre: { label: 'Théâtre', icon: faTheaterMasks, color: 'blue' },
  
  // Éducation
  school: { label: 'École', icon: faSchool, color: 'blue' },
  college: { label: 'Collège', icon: faGraduationCap, color: 'blue' },
  university: { label: 'Université', icon: faUniversity, color: 'blue' },
  library: { label: 'Bibliothèque', icon: faBookReader, color: 'blue' },
  kindergarten: { label: 'École maternelle', icon: faChild, color: 'blue' },
  educational_institution: { label: 'Établissement scolaire', icon: faSchool, color: 'blue' },
  language_school: { label: 'École de langues', icon: faLanguage, color: 'blue' },
  music_school: { label: 'École de musique', icon: faMusic, color: 'blue' },
  prep_school: { label: 'École préparatoire', icon: faGraduationCap, color: 'blue' },
  
  // Santé
  hospital: { label: 'Hôpital', icon: faHospital, color: 'blue' },
  doctor: { label: 'Médecin', icon: faUserDoctor, color: 'blue' },
  dentist: { label: 'Dentiste', icon: faTooth, color: 'blue' },
  clinic: { label: 'Clinique', icon: faHospital, color: 'blue' },
  
  // Lieux de culte et historiques
  place_of_worship: { label: 'Lieu de culte', icon: faPlaceOfWorship, color: 'blue' },
  church: { label: 'Église', icon: faChurch, color: 'blue' },
  mosque: { label: 'Mosquée', icon: faMosque, color: 'blue' },
  synagogue: { label: 'Synagogue', icon: faSynagogue, color: 'blue' },
  historic: { label: 'Site historique', icon: faLandmark, color: 'blue' },
  historic_archaeological_site: { label: 'Site archéologique', icon: faLandmark, color: 'blue' },
  historic_building: { label: 'Bâtiment historique', icon: faLandmark, color: 'blue' },
  historic_church: { label: 'Église historique', icon: faChurch, color: 'blue' },
  historic_city: { label: 'Ville historique', icon: faCity, color: 'blue' },
  historic_city_gate: { label: 'Porte de ville', icon: faArchway, color: 'blue' },
  historic_citywalls: { label: 'Remparts historique', icon: faShieldAlt, color: 'blue' },
  historic_fort: { label: 'Fort historique', icon: faLandmark, color: 'blue' },
  historic_gate: { label: 'Porte historique', icon: faArchway, color: 'blue' },
  historic_manor: { label: 'Manoir historique', icon: faLandmark, color: 'blue' },
  historic_technical_monument: { label: 'Monument technique historique', icon: faMonument, color: 'blue' },
  historic_wayside_cross: { label: 'Croix de chemin historique', icon: faCross, color: 'blue' },
  historic_yes: { label: 'Site historique', icon: faLandmark, color: 'blue' },
  ruins: { label: 'Ruines', icon: faLandmark, color: 'blue' },
  
  // Autres
  community_centre: { label: 'Centre communautaire', icon: faUsers, color: 'blue' },
  industrial: { label: 'Zone industrielle', icon: faIndustry, color: 'blue' },
  internet_cafe: { label: 'Cybercafé', icon: faLaptop, color: 'blue' },
  police_station: { label: 'Commissariat', icon: faShieldAlt, color: 'blue' },
  residential: { label: 'Résidentiel', icon: faHome, color: 'blue' },
  shop_art: { label: 'Magasin d\'art', icon: faPalette, color: 'blue' },
  supermarket: { label: 'Supermarché', icon: faShoppingBasket, color: 'blue' },
  telephone: { label: 'Téléphone', icon: faPhone, color: 'blue' },
  tourism_info: { label: 'Office de tourisme', icon: faInfoCircle, color: 'blue' },
  towing: { label: 'Dépannage', icon: faTruckPickup, color: 'blue' },
  
  // Par défaut
  default: { label: 'Lieu', icon: faMapMarkerAlt, color: 'blue' }
};

// Fonction pour obtenir le libellé d'un type de lieu
const getSimplifiedType = (type) => {
  if (!type) return 'Lieu';
  
  // Vérifier d'abord le type exact
  if (placeTypeMapping[type]) {
    return placeTypeMapping[type].label;
  }
  
  // Vérifier les types avec préfixe 'tourism_'
  if (type.startsWith('tourism_')) {
    const baseType = type.replace('tourism_', '');
    if (placeTypeMapping[baseType]) {
      return placeTypeMapping[baseType].label;
    }
  }
  
  // Vérifier les types composés (séparés par des points-virgules)
  if (type.includes(';')) {
    const types = type.split(';');
    for (const t of types) {
      if (placeTypeMapping[t]) {
        return placeTypeMapping[t].label;
      }
    }
  }
  
  // Retourner le type tel quel si non trouvé
  return type;
};

// Catégories de lieux
const placeCategories = {
  all: { label: 'Tous', icon: '🔍' },
  transport: {
    label: 'Transport',
    icon: faTrain,
    color: '#795548',
    types: [
      // Aéroports et aérodromes
      'aerodrome', 'airport', 'airfield', 'airstrip', 'helipad', 'heliport',
      'airport_terminal', 'airport_gate', 'airport_runway',
      
      // Transports en commun
      'bus_station', 'bus_stop', 'bus_terminal', 'bus_depot', 'coach_station',
      'train_station', 'railway_station', 'tram_stop', 'tram_station', 'subway',
      'subway_entrance', 'subway_station', 'light_rail', 'monorail', 'funicular',
      'cable_car', 'gondola', 'chair_lift', 'ferry_terminal', 'harbor', 'harbour',
      'port', 'marina',
      
      // Stationnement et carburant
      'parking', 'parking_space', 'bicycle_parking', 'motorcycle_parking',
      'parking_entrance', 'parking_exit', 'fuel', 'gas_station', 'charging_station',
      'electric_vehicle_charging', 'compressed_natural_gas', 'lpg', 'biodiesel',
      
      // Services liés aux véhicules
      'car_rental', 'car_sharing', 'bicycle_rental', 'bicycle_sharing',
      'car_wash', 'vehicle_inspection', 'car_repair', 'tyres', 'garage',
      'car_dealership', 'bicycle_shop', 'motorcycle_shop', 'boat_shop',
      
      // Autres
      'taxi', 'taxi_stand', 'car_sharing', 'bicycle_sharing', 'car_sharing_station',
      'bicycle_sharing_station', 'weighbridge', 'toll_booth', 'border_control',
      'customs', 'passport_control', 'trailhead'
    ]
  },
  accommodation: {
    label: 'Hébergement',
    icon: faHotel,
    color: '#FF9800',
    types: [
      'hotel', 'tourism_guest_house', 'hostel', 'apartment', 'guest_house',
      'motel', 'resort', 'chalet', 'camp_site', 'alpine_hut', 'caravan_site'
    ]
  },
  food: {
    label: 'Restauration',
    icon: faUtensils,
    color: '#FF5722',
    types: [
      'restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'bakery', 'food_court',
      'ice_cream', 'bistro', 'cafeteria', 'coffee_shop', 'diner', 'pizzeria',
      'food', 'eatery', 'brasserie', 'tavern', 'coffee', 'coffeeshop', 'café',
      'pizza', 'hamburger', 'sandwich', 'creperie', 'steakhouse', 'sushi',
      'japanese_restaurant', 'chinese_restaurant', 'italian_restaurant',
      'french_restaurant', 'mexican_restaurant', 'indian_restaurant',
      'thai_restaurant', 'greek_restaurant', 'spanish_restaurant',
      'lebanese_restaurant', 'turkish_restaurant', 'moroccan_restaurant',
      'african_restaurant', 'american_restaurant', 'asian_restaurant',
      'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'ice_cream_parlor',
      'juice_bar', 'smoothie_bar', 'tea_house', 'wine_bar', 'brewery', 'winery'
    ]
  },
  health: {
    label: 'Santé',
    icon: faHospital,
    color: '#F44336',
    types: [
      // Établissements de santé
      'hospital', 'clinic', 'health_centre', 'health_center', 'medical_centre',
      'medical_center', 'doctors', 'doctor', 'general_practitioner', 'gp',
      'dentist', 'dental_clinic', 'dental_surgery', 'orthodontist', 'optician',
      'optometrist', 'ophthalmologist', 'psychologist', 'psychotherapist',
      'psychiatrist', 'physiotherapist', 'physiotherapy', 'chiropractor',
      'osteopath', 'podiatrist', 'speech_therapist', 'occupational_therapist',
      'midwife', 'nursing_home', 'retirement_home', 'hospice', 'maternity_ward',
      'emergency_ward', 'intensive_care', 'blood_donation', 'dialysis',
      
      // Pharmacies et médicaments
      'pharmacy', 'pharmacie', 'chemist', 'drugstore', 'apothecary',
      
      // Santé animale
      'veterinary', 'veterinarian', 'vet', 'animal_hospital', 'vet_clinic',
      
      // Autres services de santé
      'laboratory', 'medical_laboratory', 'diagnostic_centre', 'xray', 'mri',
      'ultrasound', 'blood_test', 'medical_testing', 'vaccination', 'vaccine',
      'covid19_testing', 'covid19_vaccination', 'health_post', 'first_aid',
      'defibrillator', 'emergency_phone', 'emergency_service', 'ambulance_station'
    ]
  },
  shopping: {
    label: 'Shopping',
    icon: faShoppingCart,
    color: '#9C27B0',
    types: [
      'shop', 'supermarket', 'mall', 'bakery', 'clothing', 'electronics_store',
      'market', 'grocery_store', 'butcher', 'hardware_store', 'convenience',
      'department_store', 'kiosk', 'boutique', 'jewelry', 'shoes', 'fashion',
      'furniture_store', 'garden_centre', 'hairdresser', 'laundry', 'books',
      'stationery', 'toy', 'travel_agency'
    ]
  },
  education: {
    label: 'Éducation',
    icon: faGraduationCap,
    color: '#2196F3',
    types: [
      'school', 'university', 'college', 'kindergarten', 'library', 'research_institute',
      'driving_school', 'language_school', 'music_school', 'prep_school', 'toy_library',
      'university', 'faculty', 'campus', 'institute', 'school_building', 'high_school',
      'primary_school', 'secondary_school', 'nursery', 'daycare', 'crèche', 'creche'
    ]
  },
  tourism: {
    label: 'Tourisme',
    icon: faUmbrellaBeach,
    color: '#4CAF50',
    types: [
      // Hébergements touristiques
      'hotel', 'motel', 'resort', 'hostel', 'auberge', 'guest_house', 'guesthouse',
      'tourism_guest_house', 'apartment', 'apartement', 'appartement', 'chalet',
      'camp_site', 'campsite', 'camping', 'caravan_site', 'caravan_park',
      'alpine_hut', 'wilderness_hut', 'bed_and_breakfast', 'bnb',
      
      // Restauration et divertissement
      'restaurant', 'cafe', 'bar', 'pub', 'bistro', 'brasserie', 'tavern',
      'nightclub', 'disco', 'lounge', 'club', 'casino', 'theater', 'theatre',
      'cinema', 'movie_theater', 'planetarium', 'bowling', 'bowling_alley',
      
      // Attractions culturelles
      'museum', 'art_gallery', 'gallery', 'art_museum', 'history_museum',
      'monument', 'memorial', 'statue', 'sculpture', 'castle', 'chateau',
      'palace', 'fort', 'fortress', 'ruins', 'archaeological_site',
      'historical_site', 'heritage_site', 'cultural_center', 'cultural_centre',
      
      // Parcs et nature
      'park', 'national_park', 'nature_reserve', 'botanical_garden', 'zoo',
      'aquarium', 'beach', 'marina', 'harbor', 'harbour', 'lake', 'river',
      'waterfall', 'cave', 'viewpoint', 'lookout', 'panorama', 'scenic_view',
      
      // Sports et loisirs
      'sports_centre', 'stadium', 'swimming_pool', 'golf_course', 'tennis_court',
      'sports_hall', 'ice_rink', 'ski_resort', 'skiing', 'snow_park',
      'water_park', 'amusement_park', 'theme_park', 'adventure_park',
      
      // Autres
      'information', 'tourist_information', 'visitor_center', 'visitor_centre',
      'picnic_site', 'picnic_area', 'playground', 'observation_deck',
      'scenic_route', 'viewpoint', 'vista_point', 'landmark'
    ]
  },
  services: {
    label: 'Services',
    icon: '🏪',
    types: [
      // Services financiers
      'bank', 'atm', 'bureau_de_change', 'money_transfer',
      
      // Services postaux
      'post_office', 'post', 'poste', 'postal_office', 'post_box', 'post_depot',
      
      // Services administratifs
      'townhall', 'city_hall', 'mairie', 'courthouse', 'tribunal', 'embassy',
      'consulate', 'notary', 'register_office',
      
      // Services de sécurité
      'police', 'police_station', 'gendarmerie', 'fire_station', 'prison',
      
      // Services communautaires
      'library', 'community_centre', 'nursing_home', 'retirement_home',
      'social_facility', 'coworking_space', 'internet_cafe',
      
      // Services environnementaux
      'recycling', 'waste_basket', 'waste_disposal', 'waste_transfer_station',
      'water_well', 'water_point', 'drinking_water', 'fountain', 'toilets',
      'shower', 'public_bath', 'sanitary_dump_station',
      
      // Autres services
      'telephone', 'public_phone', 'clock', 'vending_machine', 'animal_boarding',
      'animal_shelter', 'veterinary', 'baby_hatch', 'funeral_hall', 'crematorium'
    ]
  },
  leisure: {
    label: 'Loisirs',
    icon: '⚽',
    types: [
      'park', 'garden', 'pitch', 'sports_centre', 'stadium', 'track', 'swimming_pool',
      'fitness_centre', 'golf_course', 'ice_rink', 'marina', 'miniature_golf',
      'playground', 'sports_hall', 'tennis_court', 'water_park',
      'fishing', 'horse_riding', 'sauna', 'sports', 'fitness', 'dance', 'yoga',
      'bowling_alley', 'dance_hall', 'dog_park', 'firepit', 'fitness_station',
      'hackerspace', 'outdoor_seating', 'picnic_table', 'slipway', 'summer_camp',
      'tanning_salon', 'trampoline_park', 'waste_disposal', 'wildlife_hide'
    ]
  }
};

const SearchBar = ({ searchQuery, handleSearchChange, setSuggestions, suggestions, handleSelectSuggestion, currentLocation, handlePlacePin, hasSelectedDestination }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  // État pour gérer l'affichage de la modale
  const [showFilters, setShowFilters] = useState(false);

  // Dictionnaire de synonymes pour les types de lieux
  const typeSynonyms = {
    // Hébergement
    'hotel': ['hotel', 'motel', 'resort', 'hostel', 'auberge', 'guest_house', 'tourism_guest_house', 'guesthouse'],
    'tourism_guest_house': ['tourism_guest_house', 'guest_house', 'guesthouse', 'bed_and_breakfast', 'bnb', 'gite'],
    'apartment': ['apartment', 'apartement', 'appartement', 'flat', 'appartment', 'apartments'],
    'camp_site': ['camp_site', 'campsite', 'camping', 'caravan_site', 'caravan_park'],
    
    // Restauration
    'restaurant': ['restaurant', 'resto', 'bistro', 'eatery', 'diner', 'brasserie', 'tavern'],
    'cafe': ['cafe', 'coffee', 'coffee_shop', 'coffeeshop', 'coffeehouse', 'café', 'coffee_house'],
    'bar': ['bar', 'pub', 'tavern', 'lounge', 'nightclub', 'club', 'disco'],
    'fast_food': ['fast_food', 'fastfood', 'fast food', 'takeaway', 'take_away', 'take_away_food'],
    
    // Transports
    'gas_station': ['gas_station', 'fuel', 'station_service', 'service_station', 'petrol_station', 'fuel_station'],
    'railway_station': ['railway_station', 'train_station', 'gare', 'rail_station', 'train_stop'],
    'bus_station': ['bus_station', 'bus_stop', 'bus_terminal', 'bus_depot'],
    'airport': ['airport', 'aerodrome', 'airfield', 'airstrip', 'airport_terminal'],
    'parking': ['parking', 'car_park', 'parking_garage', 'underground_parking', 'parking_lot'],
    
    // Santé
    'hospital': ['hospital', 'hopital', 'hôpital', 'medical_center', 'medical_centre', 'clinic', 'healthcare', 'health_center', 'health_centre'],
    'pharmacy': ['pharmacy', 'pharmacie', 'drugstore', 'chemist', 'apothecary'],
    'doctor': ['doctor', 'docteur', 'physician', 'general_practitioner', 'gp', 'médecin'],
    'dentist': ['dentist', 'dental_clinic', 'dental_surgery', 'dentiste', 'cabinet_dentaire'],
    
    // Éducation
    'school': ['school', 'école', 'school_building', 'primary_school', 'secondary_school', 'high_school', 'lycee', 'lycée'],
    'university': ['university', 'université', 'college', 'faculty', 'campus', 'institute', 'institut'],
    'library': ['library', 'bibliothèque', 'mediatheque', 'médiathèque', 'book_lending'],
    'kindergarten': ['kindergarten', 'école_maternelle', 'preschool', 'nursery_school', 'crèche', 'creche'],
    
    // Tourisme et culture
    'museum': ['museum', 'musée', 'gallery', 'art_gallery', 'art_museum', 'history_museum'],
    'tourist_attraction': ['tourist_attraction', 'attraction', 'point_of_interest', 'poi', 'landmark', 'sight', 'sightseeing'],
    'cinema': ['cinema', 'movie_theater', 'movie_theatre', 'movie_house', 'movie_house', 'multiplex'],
    'theater': ['theater', 'theatre', 'playhouse', 'opera_house', 'performing_arts'],
    'castle': ['castle', 'chateau', 'palace', 'fortress', 'fort', 'citadel', 'stronghold'],
    'monument': ['monument', 'memorial', 'statue', 'sculpture', 'commemorative_plaque'],
    'ruins': ['ruins', 'archaeological_site', 'excavation', 'ancient_ruins', 'historical_ruins'],
    'zoo': ['zoo', 'zoological_garden', 'wildlife_park', 'safari_park', 'animal_park'],
    'aquarium': ['aquarium', 'oceanarium', 'sea_life_center', 'marine_park'],
    'theme_park': ['theme_park', 'amusement_park', 'funfair', 'luna_park', 'fairground'],
    
    // Services
    'bank': ['bank', 'banque', 'atm', 'credit_union', 'savings_and_loan', 'building_society'],
    'post_office': ['post_office', 'post', 'poste', 'postal_office', 'post_office_branch'],
    'police': ['police', 'police_station', 'gendarmerie', 'police_headquarters', 'police_department'],
    'fire_station': ['fire_station', 'firehouse', 'fire_department', 'fire_brigade', 'pompier'],
    'place_of_worship': ['place_of_worship', 'worship', 'religion', 'church', 'mosque', 'temple', 'synagogue', 'cathedral', 'chapel', 'shrine'],
    
    // Commerces
    'supermarket': ['supermarket', 'supermarche', 'grocery', 'grocery_store', 'food_market', 'hypermarket'],
    'convenience': ['convenience', 'convenience_store', 'corner_shop', 'corner_store', 'deli', 'deli_shop'],
    'bakery': ['bakery', 'boulangerie', 'patisserie', 'bakehouse', 'baker'],
    'butcher': ['butcher', 'boucherie', 'butcher_shop', 'meat_market'],
    'market': ['market', 'marché', 'bazaar', 'souk', 'marketplace', 'farmers_market', 'flea_market'],
    'clothing_store': ['clothing_store', 'clothes', 'fashion', 'apparel', 'boutique', 'clothing_shop'],
    'electronics_store': ['electronics_store', 'electronics', 'electronic_goods', 'hifi', 'audio_visual'],
    'hardware_store': ['hardware_store', 'diy_store', 'home_improvement', 'building_supplies', 'hardware_shop'],
    'pharmacy': ['pharmacy', 'pharmacie', 'drugstore', 'chemist', 'apothecary'],
    'book_store': ['book_store', 'bookshop', 'book_shop', 'bookseller', 'librairie'],
    'florist': ['florist', 'flower_shop', 'fleuriste', 'flower_arrangements'],
    'jewelry': ['jewelry', 'jewellery', 'jeweller', 'jewellery_shop', 'jewelry_store'],
    'optician': ['optician', 'opticien', 'eyewear', 'eyeglasses', 'optical_shop'],
    'shoes': ['shoes', 'shoe_shop', 'shoe_store', 'footwear', 'chaussures'],
    'sports_store': ['sports_store', 'sporting_goods', 'sport_shop', 'sports_equipment'],
    'stationery': ['stationery', 'stationary', 'office_supplies', 'paper_goods', 'papeterie'],
    'toy_store': ['toy_store', 'toys', 'toy_shop', 'games_shop', 'jeux_jouets'],
    'travel_agency': ['travel_agency', 'travel_agent', 'tour_operator', 'voyage_agence', 'holidays'],
    'bicycle_shop': ['bicycle_shop', 'bike_shop', 'bicycle_store', 'bike_repair', 'velo'],
    'car_repair': ['car_repair', 'garage', 'auto_repair', 'car_workshop', 'mechanic'],
    'car_wash': ['car_wash', 'carwash', 'vehicle_wash', 'auto_wash', 'lavage_auto'],
    'car_rental': ['car_rental', 'car_hire', 'rent_a_car', 'voiture_location', 'car_leasing'],
    'hairdresser': ['hairdresser', 'hairdressing_salon', 'hair_salon', 'coiffeur', 'coiffure'],
    'beauty_salon': ['beauty_salon', 'beauty_parlor', 'beauty_shop', 'institut_beaute', 'spa_salon'],
    'dry_cleaning': ['dry_cleaning', 'laundry', 'launderette', 'pressing', 'nettoyage_a_sec'],
    'laundry': ['laundry', 'launderette', 'laundromat', 'self_service_laundry', 'laverie'],
    'pet_grooming': ['pet_grooming', 'pet_salon', 'dog_grooming', 'cat_grooming', 'toilettage'],
    'veterinary': ['veterinary', 'veterinarian', 'vet', 'animal_hospital', 'vet_clinic'],
    'funeral_home': ['funeral_home', 'funeral_parlor', 'funeral_director', 'pompes_funebres', 'thanatopracteur'],
    'storage_rental': ['storage_rental', 'self_storage', 'storage_units', 'stockage_self', 'box_stockage'],
    'pawnbroker': ['pawnbroker', 'pawn_shop', 'preteur_sur_gages', 'mont_de_piete', 'credit_municipal'],
    'money_transfer': ['money_transfer', 'money_gram', 'western_union', 'transfert_argent', 'envoi_argent'],
    'lottery': ['lottery', 'loto', 'loterie', 'jeux_de_hasard', 'pari_mutuel'],
    'casino': ['casino', 'gambling', 'gaming', 'jeu_d_argent', 'salle_de_jeu'],
    'nightclub': ['nightclub', 'night_club', 'disco', 'discotheque', 'boite_de_nuit'],
    'stripclub': ['stripclub', 'strip_club', 'cabaret', 'club_echangiste', 'club_libertin'],
    'swingerclub': ['swingerclub', 'swinging_club', 'club_echangiste', 'club_libertin', 'echangisme'],
    'adult_gaming_centre': ['adult_gaming_centre', 'adult_arcade', 'amusement_arcade', 'gaming_arcade', 'salle_de_jeu'],
    'betting': ['betting', 'betting_shop', 'pari_sportif', 'pari_mutuel', 'pmu'],
    'bingo': ['bingo', 'bingo_hall', 'loto_quine', 'salle_de_bingo', 'jeu_de_bingo'],
    'bookmaker': ['bookmaker', 'bookie', 'pari_sportif', 'parieur', 'bookmaking'],
    'tobacco': ['tobacco', 'tobacconist', 'tabac', 'cigarette_shop', 'cigar_store'],
    'vape': ['vape', 'vape_shop', 'vape_store', 'cigarette_electronique', 'vapoteuse'],
    'cannabis': ['cannabis', 'cannabis_club', 'cbd_shop', 'weed_shop', 'cannabis_social_club'],
    'head_shop': ['head_shop', 'smoke_shop', 'bong_shop', 'paraphernalia_shop', 'fumeur_accessoires'],
    'sex_shop': ['sex_shop', 'sex_shops', 'erotic_shop', 'intimate_shop', 'boutique_erotique'],
    'weapons': ['weapons', 'weapon_shop', 'gun_shop', 'armurerie', 'armes_feu'],
    'military': ['military', 'military_base', 'barracks', 'casernement', 'zone_militaire'],
    'prison': ['prison', 'jail', 'detention_center', 'penitentiary', 'maison_arret'],
    'embassy': ['embassy', 'consulate', 'diplomatic_mission', 'ambassade', 'consulat'],
    'courthouse': ['courthouse', 'tribunal', 'court', 'palais_justice', 'tribunal_judiciaire'],
    'townhall': ['townhall', 'mairie', 'city_hall', 'hôtel_de_ville', 'municipal_building'],
    'community_centre': ['community_centre', 'community_center', 'salle_des_fetes', 'maison_commune', 'centre_socio_culturel'],
    'nursing_home': ['nursing_home', 'retirement_home', 'maison_retraite', 'ehpad', 'residence_personnes_agees'],
    'social_facility': ['social_facility', 'social_services', 'action_sociale', 'ccas', 'centre_communal_action_sociale'],
    'animal_boarding': ['animal_boarding', 'pet_boarding', 'pension_animale', 'pension_animaux', 'garderie_animaux'],
    'animal_shelter': ['animal_shelter', 'refuge_animalier', 'spa', 'societe_protection_animaux', 'fourriere'],
    'baby_hatch': ['baby_hatch', 'tour_abandon', 'boite_a_bebe', 'nid_ange', 'accouchement_sous_x'],
    'clock': ['clock', 'horloge', 'horlogerie', 'pendule', 'horloger'],
    'coworking_space': ['coworking_space', 'espace_coworking', 'bureau_partage', 'espace_travail_partage', 'tiers_lieu'],
    'crematorium': ['crematorium', 'crematory', 'cremator', 'crematorium_chapel', 'crematorium_garden'],
    'dive_centre': ['dive_centre', 'diving_center', 'plongee_centre', 'centre_plongee', 'diving_centre'],
    'funeral_hall': ['funeral_hall', 'funeral_home', 'funeral_parlor', 'funerarium', 'salle_ceremonie'],
    'hunting_stand': ['hunting_stand', 'hunting_blind', 'hunting_platform', 'mirador_chasse', 'poste_chasse'],
    'internet_cafe': ['internet_cafe', 'cybercafe', 'cyber_cafe', 'cyber_espace', 'espace_multimedia'],
    'kneipp_water_cure': ['kneipp_water_cure', 'kneipp_therapy', 'kneipp_cure', 'cure_kneipp', 'hydrotherapie_kneipp'],
    'marketplace': ['marketplace', 'marche', 'halles', 'marche_couvert', 'marche_public'],
    'monastery': ['monastery', 'abbey', 'convent', 'priory', 'couvent'],
    'photo_booth': ['photo_booth', 'photomaton', 'photo_automat', 'cabine_photo', 'photoscope'],
    'place_of_worship': ['place_of_worship', 'worship_place', 'lieu_culte', 'edifice_religieux', 'temple_religieux'],
    'public_bath': ['public_bath', 'baths', 'thermes', 'bain_public', 'etablissement_thermal'],
    'public_bookcase': ['public_bookcase', 'book_exchange', 'boite_livre', 'bibliotheque_ruche', 'micro_bibliotheque'],
    'sanitary_dump_station': ['sanitary_dump_station', 'waste_disposal', 'vidange_camping_car', 'aire_services_camping_car', 'station_vidange'],
    'sauna': ['sauna', 'hammam', 'bain_turc', 'bain_vapeur', 'sauna_finlandais'],
    'shelter': ['shelter', 'refuge', 'abri', 'centre_hebergement', 'accueil_nuit'],
    'shower': ['shower', 'douche', 'douches_publics', 'salle_douches', 'douche_publique'],
    'studio': ['studio', 'recording_studio', 'studio_enregistrement', 'studio_son', 'home_studio'],
    'swingerclub': ['swingerclub', 'club_echangiste', 'club_libertin', 'club_echange', 'club_libertinage'],
    'telephone': ['telephone', 'public_phone', 'phone_booth', 'cabine_telephonique', 'borne_telephonique'],
    'toilets': ['toilets', 'toilet', 'wc', 'sanitaires', 'toilettes_publics'],
    'vending_machine': ['vending_machine', 'distributeur_automatique', 'distributeur', 'automate', 'distributeur_automatique'],
    'waste_basket': ['waste_basket', 'trash_can', 'poubelle', 'corbeille', 'poubelle_publique'],
    'waste_disposal': ['waste_disposal', 'dechetterie', 'dechets', 'poubelle', 'container_ordure'],
    'waste_transfer_station': ['waste_transfer_station', 'centre_tri', 'dechetterie', 'centre_traitement_dechets', 'centre_valorisation_dechets'],
    'watering_place': ['watering_place', 'point_eau', 'abreuvoir', 'fontaine_abreuvoir', 'point_abreuvement'],
    'water_point': ['water_point', 'borne_fontaine', 'point_eau_potable', 'fontaine_eau_potable', 'borne_incendie'],
    'water_tap': ['water_tap', 'robinet', 'point_eau', 'borne_fontaine', 'fontaine'],
    'water_well': ['water_well', 'puits', 'forage', 'puits_artesien', 'puits_creuse']
  };

  // Fonction pour normaliser un type de lieu (en minuscules et sans espaces)
  const normalizeType = (type) => {
    if (!type) return '';
    return type.toString().toLowerCase().replace(/\s+/g, '_');
  };

  // Fonction pour obtenir tous les synonymes d'un type
  const getTypeSynonyms = (type) => {
    const normalized = normalizeType(type);
    // Vérifie si le type est une clé de synonyme
    for (const [key, synonyms] of Object.entries(typeSynonyms)) {
      if (key === normalized || synonyms.includes(normalized)) {
        return [key, ...synonyms];
      }
    }
    // Si aucun synonyme trouvé, retourne le type tel quel
    return [normalized];
  };

  // Fonction pour vérifier si un type correspond à une catégorie
  const isTypeInCategory = (type, category) => {
    if (!type || !category || category === 'all') return true;
    
    // Obtenir les types de la catégorie
    const categoryTypes = placeCategories[category]?.types || [];
    if (categoryTypes.length === 0) return true;
    
    // Normaliser le type à vérifier
    const normalizedType = normalizeType(type);
    
    // Vérifier si le type correspond directement à un des types de la catégorie
    if (categoryTypes.includes(normalizedType)) return true;
    
    // Vérifier les synonymes pour chaque type de la catégorie
    for (const categoryType of categoryTypes) {
      const synonyms = getTypeSynonyms(categoryType);
      if (synonyms.includes(normalizedType)) {
        return true;
      }
    }
    
    // Vérifier les correspondances partielles pour les types composés (séparés par des points-virgules)
    if (normalizedType.includes(';')) {
      const typeParts = normalizedType.split(';');
      for (const part of typeParts) {
        if (categoryTypes.includes(part.trim())) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Fonction pour filtrer les suggestions par catégorie côté client
  const filterSuggestionsByCategory = (suggestions, category) => {
    if (!suggestions || !Array.isArray(suggestions) || category === 'all') {
      return suggestions || [];
    }
    
    // Obtenir les types de la catégorie
    const categoryTypes = placeCategories[category]?.types || [];
    if (categoryTypes.length === 0) return suggestions;
    
    console.log('Filtrage des suggestions par catégorie:', category);
    console.log('Types de la catégorie:', categoryTypes);
    
    // Préparer les types de catégorie normalisés pour la recherche
    const normalizedCategoryTypes = new Set();
    
    // Ajouter les types de base de la catégorie
    categoryTypes.forEach(type => {
      normalizedCategoryTypes.add(normalizeType(type));
      
      // Ajouter les synonymes de chaque type
      const synonyms = getTypeSynonyms(type);
      synonyms.forEach(synonym => normalizedCategoryTypes.add(normalizeType(synonym)));
    });
    
    console.log('Types de catégorie normalisés:', Array.from(normalizedCategoryTypes));
    
    // Filtrer les suggestions
    return suggestions.filter(suggestion => {
      if (!suggestion || !suggestion.type) return false;
      
      const suggestionType = suggestion.type;
      const normalizedSuggestionType = normalizeType(suggestionType);
      
      // Vérifier si le type de suggestion correspond à un des types de la catégorie
      if (normalizedCategoryTypes.has(normalizedSuggestionType)) {
        return true;
      }
      
      // Vérifier les types composés (séparés par des points-virgules)
      if (normalizedSuggestionType.includes(';')) {
        const typeParts = normalizedSuggestionType.split(';');
        for (const part of typeParts) {
          const trimmedPart = part.trim();
          if (trimmedPart && normalizedCategoryTypes.has(trimmedPart)) {
            return true;
          }
        }
      }
      
      // Vérifier les synonymes
      for (const [key, synonyms] of Object.entries(typeSynonyms)) {
        if (synonyms.includes(normalizedSuggestionType) && 
            normalizedCategoryTypes.has(normalizeType(key))) {
          return true;
        }
      }
      
      return false;
    });
  };

  // Fonction pour chercher les suggestions avec une catégorie
  const fetchSuggestions = async (query, category = 'all') => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const searchQuery = query.trim();
    console.log('Recherche de suggestions avec:', { query: searchQuery, category });
    
    try {
      // Afficher un indicateur de chargement si nécessaire
      // setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: searchQuery,
          category: category === 'all' ? null : category
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        console.error('Erreur de réponse du serveur:', response.status, errorText);
        // Vous pourriez vouloir afficher un message d'erreur à l'utilisateur ici
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      let data = await response.json();
      
      // Vérifier que les données sont un tableau
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data);
        data = [];
      }
      
      // Filtrage côté client en complément du filtrage serveur
      if (data.length > 0 && category !== 'all') {
        const filteredData = filterSuggestionsByCategory(data, category);
        console.log(`Filtrage côté client: ${data.length} -> ${filteredData.length} résultats`);
        data = filteredData;
      }
      
      console.log('Suggestions reçues:', data);
      setSuggestions(data);
      
      // Si pas de résultats, vous pourriez vouloir afficher un message
      if (data.length === 0) {
        console.log('Aucun résultat trouvé pour cette recherche');
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      // Vous pourriez vouloir afficher un message d'erreur à l'utilisateur ici
      setSuggestions([]);
    } finally {
      // Cacher l'indicateur de chargement si nécessaire
      // setLoading(false);
    }
  };
  
  // Gérer le changement de recherche
  const handleSearch = (value) => {
    handleSearchChange(value);
    // La recherche est maintenant gérée par l'effet ci-dessus
  };
  
  // Gérer le changement de catégorie
  const handleCategoryChange = (category) => {
    console.log('Changement de catégorie:', category);
    if (category === activeCategory) return; // Ne rien faire si la catégorie est la même
    
    setActiveCategory(category);
    
    // Si on a une recherche en cours
    if (searchQuery && searchQuery.trim().length >= 2) {
      console.log('Recherche avec la nouvelle catégorie:', category);
      
      // Si on a déjà des suggestions, on filtre d'abord avec les données actuelles
      // pour une réponse immédiate (UX plus réactive)
      if (suggestions.length > 0) {
        const filtered = filterSuggestionsByCategory(suggestions, category);
        console.log('Filtrage côté client (rapide):', filtered);
        setSuggestions(filtered);
      }
      
      // Ensuite, on fait une nouvelle requête au serveur avec la catégorie
      // pour obtenir des résultats plus précis
      fetchSuggestions(searchQuery, category);
    } else if (suggestions.length > 0) {
      // Si on change de catégorie sans recherche active mais avec des suggestions,
      // on filtre les suggestions existantes
      const filtered = filterSuggestionsByCategory(suggestions, category);
      console.log('Filtrage des suggestions existantes:', filtered);
      setSuggestions(filtered);
    }
  };
  
  // Effet pour gérer la recherche quand la requête ou la catégorie change
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        console.log('Recherche avec effet:', { query: searchQuery, category: activeCategory });
        fetchSuggestions(searchQuery, activeCategory);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, activeCategory]);

  // L'option de pin s'affiche toujours sauf quand une destination est sélectionnée
  const showPinOption = !hasSelectedDestination;

  // Vérifier si la liste des suggestions doit être affichée
  const shouldShowSuggestions = searchQuery && suggestions.length > 0;

  return (
    <div className={styles.searchBar}>

      {/* Modale des filtres */}
      {showFilters && (
        <div className={styles.modalOverlay} onClick={() => setShowFilters(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Filtrer par catégorie</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowFilters(false)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.categoryFilters}>
                {Object.entries(placeCategories).map(([key, category]) => (
                  <button
                    key={key}
                    className={`${styles.categoryButton} ${activeCategory === key ? styles.activeCategory : ''}`}
                    onClick={() => {
                      handleCategoryChange(key);
                      setShowFilters(false);
                    }}
                    title={category.label}
                  >
                    <span className={styles.categoryIcon}>
                      {typeof category.icon === 'string' ? (
                        category.icon
                      ) : (
                        <FontAwesomeIcon icon={category.icon} />
                      )}
                    </span>
                    <span className={styles.categoryLabel}>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          placeholder="Rechercher un lieu..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) {
              handleSelectSuggestion(suggestions[0]);
            }
          }}
          className={styles.searchInput}
        />
        
        {/* Bouton de filtre à droite de la barre de recherche */}
        {searchQuery && searchQuery.trim().length > 0 && (
          <div className={styles.filterButtonRight}>
            <button 
              className={styles.filterButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowFilters(true);
              }}
              title="Filtrer par catégorie"
            >
              <FontAwesomeIcon icon={faFilter} />
              <span>Filtrer</span>
              {activeCategory !== 'all' && (
                <span className={styles.activeFilterIndicator}></span>
              )}
            </button>
          </div>
        )}
        {searchQuery && (
          <button
            onClick={() => {
              handleSearchChange({ target: { value: '' } });
              setSuggestions([]);
            }}
            className={styles.clearButton}
            aria-label="Effacer la recherche"
          >
            ×
          </button>
        )}
      </div>
      {shouldShowSuggestions && (
        <ul className={styles.suggestionsList}>
          {showPinOption && (
            <li 
              onClick={handlePlacePin}
              className={styles.pinSuggestionItem}
            >
              <FontAwesomeIcon 
                icon={faMapPin} 
                className={styles.pinIcon} 
              />
              <div className={styles.pinText}>
                Placer un pin sur la carte
              </div>
            </li>
          )}
          {suggestions.map((suggestion, index) => {
            const distance =
              currentLocation && suggestion.lat && suggestion.lon
                ? haversineDistance(currentLocation, [suggestion.lat, suggestion.lon])
                : null;
            const time = distance ? estimateTime(distance) : null;
            
            // Récupérer les informations du type de lieu directement depuis le mapping local
            const typeInfo = placeTypeMapping[suggestion.type] || placeTypeMapping.default;
            const typeLabel = typeInfo?.label || suggestion.type || 'Lieu';
            // La ville est directement disponible dans suggestion.city
            const city = suggestion.city || '';
            
            // Utiliser l'icône du type ou l'icône par défaut
            const iconInfo = placeTypeMapping[suggestion.type] || placeTypeMapping.default;
            const icon = iconInfo.icon || faMapMarkerAlt;
            const iconColor = iconInfo.color || '#1a73e8';
            
            return (
              <li
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={styles.suggestionItem}
              >
                <div className={styles.suggestionIcon} style={{ color: iconColor }}>
                  <FontAwesomeIcon icon={icon} />
                </div>
                <div className={styles.suggestionInfo}>
                  <div className={styles.suggestionName}>
                    {suggestion.display_name?.split(',')[0] || suggestion.name}
                  </div>
                  <div className={styles.suggestionDetails}>
                    <div className={styles.suggestionMeta}>
                      {city && (
                        <span className={styles.cityName}>
                          {city}
                        </span>
                      )}
                      <span className={styles.placeType}>
                        {typeLabel}
                      </span>
                    </div>
                  </div>
                </div>
                {distance && (
                  <div className={styles.distanceInfo}>
                    <div className={styles.distanceItem}>
                      <FontAwesomeIcon icon={faRoute} className={styles.distanceIcon} />
                      {formatDistance(distance)}
                    </div>
                    {time && (
                      <div className={styles.timeBadge}>
                        <FontAwesomeIcon icon={faClock} className={styles.distanceIcon} />
                        {formatTime(time)}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
