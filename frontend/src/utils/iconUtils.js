import L from 'leaflet';
import {
  faHotel, faUtensils, faTree, faMapMarkerAlt, faShoppingCart, faStore, faBreadSlice, faCut,
  faTshirt, faShoePrints, faLaptop, faMobileAlt, faCar, faTools, faCouch, faBook, faSpa, faScissors,
  faHome, faBuilding, faLandmark, faInfoCircle, faCoffee, faHamburger, faGlassMartini, faHospital,
  faClinicMedical, faPrescriptionBottle, faSchool, faUniversity, faBookOpen, faPiggyBank, faMoneyCheckAlt,
  faMailBulk, faShieldAlt, faMosque, faChurch, faParking, faGasPump, faShoppingBasket, faTheaterMasks,
  faFilm, faMonument, faArchway, faGem, faPlane, faHelicopter
} from '@fortawesome/free-solid-svg-icons';

const placeIcons = {
  supermarket: faShoppingCart,
  convenience: faStore,
  bakery: faBreadSlice,
  butcher: faCut,
  clothes: faTshirt,
  shoes: faShoePrints,
  electronics: faLaptop,
  mobile_phone: faMobileAlt,
  car: faCar,
  car_parts: faTools,
  hardware: faTools,
  furniture: faCouch,
  books: faBook,
  beauty: faSpa,
  hairdresser: faScissors,
  hotel: faHotel,
  guest_house: faHome,
  hostel: faBuilding,
  apartment: faHome,
  museum: faLandmark,
  attraction: faMapMarkerAlt,
  information: faInfoCircle,
  restaurant: faUtensils,
  cafe: faCoffee,
  fast_food: faHamburger,
  bar: faGlassMartini,
  hospital: faHospital,
  clinic: faClinicMedical,
  pharmacy: faPrescriptionBottle,
  school: faSchool,
  university: faUniversity,
  library: faBookOpen,
  bank: faPiggyBank,
  atm: faMoneyCheckAlt,
  post_office: faMailBulk,
  police: faShieldAlt,
  mosque: faMosque,
  place_of_worship: faChurch,
  parking: faParking,
  fuel: faGasPump,
  marketplace: faShoppingBasket,
  theatre: faTheaterMasks,
  cinema: faFilm,
  monument: faMonument,
  ruins: faArchway,
  castle: faBuilding,
  memorial: faMonument,
  archaeological_site: faGem,
  tomb: faGem,
  wayside_shrine: faChurch,
  aerodrome: faPlane,
  heliport: faHelicopter,
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

export { placeIcons, orangePinIcon, redPinIcon };
