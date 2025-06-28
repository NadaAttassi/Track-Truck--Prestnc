import L from 'leaflet';
import {
  faHotel, faUtensils, faMapMarkerAlt, faShoppingCart, faStore, faBreadSlice, faCut,
  faTshirt, faShoePrints, faLaptop, faMobileAlt, faCar, faTools, faCouch, faBook, faSpa, faScissors,
  faHome, faBuilding, faLandmark, faInfoCircle, faCoffee, faHamburger, faGlassMartini, faHospital,
  faClinicMedical, faPrescriptionBottle, faSchool, faUniversity, faBookOpen, faPiggyBank, faMoneyCheckAlt,
  faMailBulk, faShieldAlt, faMosque, faChurch, faParking, faGasPump, faShoppingBasket, faTheaterMasks,
  faFilm, faMonument, faArchway, faGem, faPlane, faHelicopter, faTruck
} from '@fortawesome/free-solid-svg-icons';

// Création de l'icône de camion personnalisée
const truckIcon = L.divIcon({
  className: 'truck-icon',
  html: '<i class="fas fa-truck" style="font-size: 24px; color: #007bff;"></i>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const placeIcons = {
  // Magasins et commerces
  supermarket: faShoppingCart,
  convenience: faStore,
  grocery_store: faStore,
  bakery: faBreadSlice,
  butcher: faCut,
  clothes: faTshirt,
  clothing_store: faTshirt,
  shoes: faShoePrints,
  shoe_store: faShoePrints,
  electronics: faLaptop,
  electronics_store: faLaptop,
  mobile_phone: faMobileAlt,
  phone_store: faMobileAlt,
  car: faCar,
  car_dealership: faCar,
  car_parts: faTools,
  auto_parts: faTools,
  hardware: faTools,
  hardware_store: faTools,
  furniture: faCouch,
  furniture_store: faCouch,
  books: faBook,
  bookstore: faBook,
  beauty: faSpa,
  beauty_salon: faSpa,
  hairdresser: faScissors,
  hair_salon: faScissors,
  
  // Hébergements et tourisme
  hotel: faHotel,
  guest_house: faHome,
  guesthouse: faHome,
  hostel: faBuilding,
  apartment: faHome,
  
  // Culture et divertissement
  museum: faLandmark,
  attraction: faMapMarkerAlt,
  tourist_attraction: faMapMarkerAlt,
  information: faInfoCircle,
  tourist_info: faInfoCircle,
  restaurant: faUtensils,
  cafe: faCoffee,
  fast_food: faHamburger,
  bar: faGlassMartini,
  theatre: faTheaterMasks,
  theater: faTheaterMasks,
  cinema: faFilm,
  
  // Santé et éducation
  hospital: faHospital,
  clinic: faClinicMedical,
  pharmacy: faPrescriptionBottle,
  school: faSchool,
  university: faUniversity,
  library: faBookOpen,
  
  // Services
  bank: faPiggyBank,
  atm: faMoneyCheckAlt,
  post_office: faMailBulk,
  police: faShieldAlt,
  police_station: faShieldAlt,
  
  // Lieux de culte
  mosque: faMosque,
  place_of_worship: faChurch,
  religious_site: faChurch,
  shrine: faChurch,
  
  // Transport
  parking: faParking,
  fuel: faGasPump,
  gas_station: faGasPump,
  
  // Marchés
  marketplace: faShoppingBasket,
  market: faShoppingBasket,
  
  // Sites historiques
  monument: faMonument,
  ruins: faArchway,
  castle: faBuilding,
  memorial: faMonument,
  archaeological_site: faGem,
  tomb: faGem,
  wayside_shrine: faChurch,
  
  // Transport aérien
  aerodrome: faPlane,
  airport: faPlane,
  heliport: faHelicopter,
  
  // Par défaut
  default: faMapMarkerAlt,
};

const orangePinIcon = new L.Icon({
  iconUrl: '/src.png',
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [1, -34],
});

const redPinIcon = new L.Icon({
  iconUrl: '/dest.png',
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [1, -34],
});

export const bluePinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

export { placeIcons, orangePinIcon, redPinIcon, truckIcon };
