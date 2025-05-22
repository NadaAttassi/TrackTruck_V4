const axios = require('axios');
const { Client, types } = require('pg');
const { performance } = require('perf_hooks');

// Configurer les types PostgreSQL pour éviter les problèmes de conversion
types.setTypeParser(1700, value => parseFloat(value)); // NUMERIC type

// Configuration de la connexion à PostgreSQL
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'test',
  password: 'ma_data',
  port: 5432,
});

// Base de données des villes marocaines avec leurs coordonnées approximatives
const moroccanCitiesDb = [
  { name: 'Casablanca', lat: 33.5731, lon: -7.5898, radius: 0.3 },
  { name: 'Rabat', lat: 34.0209, lon: -6.8416, radius: 0.2 },
  { name: 'Marrakech', lat: 31.6295, lon: -7.9811, radius: 0.25 },
  { name: 'Fès', lat: 34.0181, lon: -5.0078, radius: 0.2 },
  { name: 'Tanger', lat: 35.7595, lon: -5.8340, radius: 0.2 },
  { name: 'Agadir', lat: 30.4278, lon: -9.5981, radius: 0.25 },
  { name: 'Meknès', lat: 33.8935, lon: -5.5547, radius: 0.2 },
  { name: 'Oujda', lat: 34.6805, lon: -1.9063, radius: 0.2 },
  { name: 'Kénitra', lat: 34.2610, lon: -6.5802, radius: 0.2 },
  { name: 'Tétouan', lat: 35.5784, lon: -5.3622, radius: 0.2 },
  { name: 'Safi', lat: 32.2994, lon: -9.2372, radius: 0.2 },
  { name: 'Mohammedia', lat: 33.6864, lon: -7.3830, radius: 0.2 },
  { name: 'El Jadida', lat: 33.2549, lon: -8.5079, radius: 0.2 },
  { name: 'Béni Mellal', lat: 32.3367, lon: -6.3606, radius: 0.2 },
  { name: 'Nador', lat: 35.1681, lon: -2.9330, radius: 0.2 },
  { name: 'Essaouira', lat: 31.5125, lon: -9.7700, radius: 0.2 },
  { name: 'Taza', lat: 34.2100, lon: -4.0100, radius: 0.2 },
  { name: 'Khouribga', lat: 32.8811, lon: -6.9063, radius: 0.2 },
  { name: 'Ouarzazate', lat: 30.9200, lon: -6.8936, radius: 0.3 },
  { name: 'Settat', lat: 33.0014, lon: -7.6170, radius: 0.2 },
  { name: 'Berkane', lat: 34.9177, lon: -2.3193, radius: 0.2 },
  { name: 'Larache', lat: 35.1932, lon: -6.1561, radius: 0.2 },
  { name: 'Khemisset', lat: 33.8242, lon: -6.0658, radius: 0.2 },
  { name: 'Guelmim', lat: 28.9864, lon: -10.0568, radius: 0.25 },
  { name: 'Berrechid', lat: 33.2655, lon: -7.5844, radius: 0.2 },
  { name: 'Chefchaouen', lat: 35.1689, lon: -5.2636, radius: 0.2 },
  { name: 'Dakhla', lat: 23.6848, lon: -15.9579, radius: 0.3 },
  { name: 'Laâyoune', lat: 27.1418, lon: -13.1872, radius: 0.3 },
  { name: 'Al Hoceima', lat: 35.2494, lon: -3.9280, radius: 0.2 },
  { name: 'Taourirt', lat: 34.4073, lon: -2.8931, radius: 0.2 },
  { name: 'Fkih Ben Salah', lat: 32.5022, lon: -6.6884, radius: 0.2 },
  { name: 'Errachidia', lat: 31.9316, lon: -4.4230, radius: 0.25 },
  { name: 'Tiznit', lat: 29.6974, lon: -9.7369, radius: 0.2 },
  { name: 'Tiflet', lat: 33.8947, lon: -6.3060, radius: 0.2 },
  { name: 'Salé', lat: 34.0531, lon: -6.7988, radius: 0.2 },
  { name: 'Benslimane', lat: 33.6185, lon: -7.1192, radius: 0.2 },
  { name: 'Temara', lat: 33.9295, lon: -6.9158, radius: 0.2 },
  { name: 'Ifrane', lat: 33.5272, lon: -5.1059, radius: 0.2 },
  { name: 'Azrou', lat: 33.4372, lon: -5.2207, radius: 0.2 },
  { name: 'Assilah', lat: 35.4646, lon: -6.0349, radius: 0.2 },
  { name: 'Tan-Tan', lat: 28.4380, lon: -11.1031, radius: 0.25 },
  { name: 'Zagora', lat: 30.3324, lon: -5.8384, radius: 0.25 },
  { name: 'Midelt', lat: 32.6852, lon: -4.7333, radius: 0.25 },
  // Zones supplémentaires pour couvrir les régions rurales
  { name: 'Région de Ouarzazate', lat: 30.75, lon: -7.3, radius: 0.8 },
  { name: 'Région du Rif', lat: 35.0, lon: -4.5, radius: 0.8 },
  { name: 'Région de l\'Atlas', lat: 31.8, lon: -6.5, radius: 0.8 },
  { name: 'Région de Souss', lat: 30.2, lon: -8.5, radius: 0.8 },
  { name: 'Région du Draa', lat: 29.7, lon: -8.0, radius: 0.8 },
  { name: 'Région du Tafilalet', lat: 31.0, lon: -4.5, radius: 0.8 },
  { name: 'Sud Marocain', lat: 28.0, lon: -10.0, radius: 1.0 }
];

// Listes de référence pour validation des données
const excludedTerritories = [
  'ceuta', 'melilla', 'la línea', 'la linea', 'algeciras', 'gibraltar', 'tenerife', 
  'las palmas', 'gran canaria', 'fuerteventura', 'lanzarote', 'sevilla'
];

// Mappage des types pour simplification
const typeMapping = {
  'shop': {
    'supermarket': 'supermarket',
    'convenience': 'grocery_store',
    'bakery': 'bakery',
    'butcher': 'butcher',
    'clothes': 'clothing_store',
    'shoes': 'shoe_store',
    'electronics': 'electronics_store',
    'mobile_phone': 'phone_store',
    'car': 'car_dealership',
    'car_parts': 'auto_parts',
    'hardware': 'hardware_store',
    'furniture': 'furniture_store',
    'books': 'bookstore',
    'beauty': 'beauty_salon',
    'hairdresser': 'hair_salon'
  },
  'tourism': {
    'hotel': 'hotel',
    'guest_house': 'guest_house',
    'hostel': 'hostel',
    'apartment': 'apartment',
    'museum': 'museum',
    'attraction': 'tourist_attraction',
    'information': 'tourist_info'
  },
  'amenity': {
    'restaurant': 'restaurant',
    'cafe': 'cafe',
    'fast_food': 'fast_food',
    'bar': 'bar',
    'hospital': 'hospital',
    'clinic': 'clinic',
    'pharmacy': 'pharmacy',
    'school': 'school',
    'university': 'university',
    'library': 'library',
    'bank': 'bank',
    'atm': 'atm',
    'post_office': 'post_office',
    'police': 'police_station',
    'mosque': 'mosque',
    'place_of_worship': 'religious_site',
    'parking': 'parking',
    'fuel': 'gas_station',
    'marketplace': 'market',
    'theatre': 'theater',
    'cinema': 'cinema'
  },
  'historic': {
    'monument': 'monument',
    'ruins': 'ruins',
    'castle': 'castle',
    'memorial': 'memorial',
    'archaeological_site': 'archaeological_site',
    'tomb': 'tomb',
    'wayside_shrine': 'shrine'
  },
  'aeroway': {
    'aerodrome': 'aerodrome', 
    'heliport': 'heliport' 
  }
};


function simplifyType(rawType) {
  if (!rawType) return 'unknown';

  // Enlever les préfixes shop_, tourism_, etc.
  let parts = rawType.split('_');

  if (parts.length > 1 && typeMapping[parts[0]] && typeMapping[parts[0]][parts[1]]) {
    return typeMapping[parts[0]][parts[1]];
  } else if (typeMapping.amenity && typeMapping.amenity[rawType]) {
    return typeMapping.amenity[rawType];
  } else if (typeMapping.aeroway && typeMapping.aeroway[rawType]) {
    return typeMapping.aeroway[rawType]; // Gestion des aéroports
  } else if (rawType === 'aeroway_aerodrome') {
    return 'aerodrome'; // Cas spécifique pour les aéroports
  }

  return rawType;
}

// Vérifier si un lieu est au Maroc
function isInMorocco(element, city) {
  // Vérification par coordonnées
  const isInMoroccanCoordinates = element.lat >= 27.5 && element.lat <= 36.0 && 
                                  element.lon >= -13.2 && element.lon <= -1.0;
  
  // Exclure Ceuta et Melilla
  const isCeuta = element.lat >= 35.8 && element.lat <= 36.0 && 
                  element.lon >= -5.4 && element.lon <= -5.2;
  
  const isMelilla = element.lat >= 35.2 && element.lat <= 35.4 && 
                    element.lon >= -3.1 && element.lon <= -2.9;
  
  // Vérification par nom de ville
  if (city) {
    const cityLower = city.toLowerCase();
    
    // Si la ville est explicitement exclue
    if (excludedTerritories.some(territory => cityLower.includes(territory))) {
      return false;
    }
  }
  
  // Par défaut, utiliser les coordonnées
  return isInMoroccanCoordinates && !isCeuta && !isMelilla;
}

// Déterminer la ville d'un POI de façon fiable
function determineCity(element) {
  // Utiliser la ville si disponible dans les tags
  const cityFromTags = element.tags['addr:city'] || element.tags.city;
  
  if (cityFromTags) {
    // Vérifier que ce n'est pas une ville exclue
    const cityLower = cityFromTags.toLowerCase();
    if (!excludedTerritories.some(territory => cityLower.includes(territory))) {
      return cityFromTags;
    }
  }
  
  // Méthode par proximité avec la base de données des villes marocaines
  // Trouver la ville la plus proche dans notre base de données
  let closestCity = null;
  let minDistance = Infinity;
  
  for (const city of moroccanCitiesDb) {
    const distance = Math.sqrt(
      Math.pow(element.lat - city.lat, 2) + 
      Math.pow(element.lon - city.lon, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }
  
  // Si on a trouvé une ville proche dans un rayon acceptable
  if (closestCity && minDistance <= closestCity.radius) {
    return closestCity.name;
  }
  
  // Méthode par région approximative si pas de ville précise
  // On essaie de déterminer au moins la région
  for (const region of moroccanCitiesDb.slice(-7)) { // Les 7 derniers éléments sont les régions
    const distance = Math.sqrt(
      Math.pow(element.lat - region.lat, 2) + 
      Math.pow(element.lon - region.lon, 2)
    );
    
    if (distance <= region.radius) {
      return region.name;
    }
  }
  
  // Aucune ville ne peut être déterminée
  return null;
}

// Créer la table avec la colonne city
async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS places (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lon DOUBLE PRECISION NOT NULL,
      osm_id BIGINT,
      type TEXT NOT NULL,
      city TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_places_type ON places(type);
    CREATE INDEX IF NOT EXISTS idx_places_city ON places(city);
    CREATE INDEX IF NOT EXISTS idx_places_coords ON places(lat, lon);
  `;
  
  try {
    // Vérifier si la table existe déjà
    const checkTable = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'places')"
    );
    
    if (checkTable.rows[0].exists) {
      await client.query('DROP TABLE places');
      console.log('✓ Table existante supprimée');
    }
    
    await client.query(query);
    console.log('✓ Table créée avec succès (colonne city NOT NULL)');
  } catch (err) {
    console.error('✗ Erreur lors de la création de la table:', err.message);
    throw err;
  }
}

// Insertion optimisée avec traitement par lots
async function insertPlaces(places) {
  if (places.length === 0) return;
  
  try {
    // Construire une requête d'insertion multiple pour optimiser les performances
    const values = places.map((place, i) => {
      const offset = i * 6;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
    }).join(', ');
    
    const params = places.flatMap(place => [
      place.name, 
      place.lat, 
      place.lon, 
      place.id, 
      place.type, 
      place.city
    ]);
    
    const query = `
      INSERT INTO places (name, lat, lon, osm_id, type, city)
      VALUES ${values}
      ON CONFLICT DO NOTHING;
    `;
    
    await client.query(query, params);
    console.log(`✓ ${places.length} lieux insérés en lot`);
  } catch (err) {
    console.error('✗ Erreur lors de l\'insertion en lot:', err.message);
  }
}

// Récupération des données via Overpass API
async function fetchPlaces() {
  const startTime = performance.now();
  console.log('⏳ Récupération des données depuis Overpass API...');
  
  // Coordonnées du Maroc
  const bbox = '27.0,-13.5,36.5,-1.0';
  
  // Construire une requête Overpass optimisée pour éviter les timeouts
  const queries = [
    // Équipements
    `node["amenity"~"restaurant|cafe|hospital|school|university|pharmacy|bank|mosque|post_office|library|theatre|cinema|fuel|parking|marketplace|police"](${bbox});`,
    
    // Commerces par catégories
    `node["shop"~"supermarket|convenience|bakery|butcher|clothes|shoes|electronics"](${bbox});`,
    `node["shop"~"mobile_phone|car|car_parts|hardware|furniture|books|beauty|hairdresser"](${bbox});`,
    
    // Tourisme
    `node["tourism"~"hotel|guest_house|museum|attraction|information"](${bbox});`,
    
    // Sites historiques
    `node["historic"](${bbox});`,
    
    // Gares et aéroports
    `node["railway"~"station"](${bbox});`,
    `node["aeroway"~"aerodrome"](${bbox});`,
    
    // Universités, FST, et facultés
    `node["amenity"~"university|college"](${bbox});`,
    `node["amenity"~"school"]["school:type"~"university|college"](${bbox});`
  ];
  
  const overpassQuery = '[out:json][timeout:90];(' + queries.join('') + ');out body;';
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
  
  try {
    const response = await axios.get(url, { timeout: 120000 }); // 2 minutes timeout
    const elements = response.data.elements;
    console.log(`✓ ${elements.length} éléments trouvés`);
    
    let validPlaces = 0;
    let skippedPlaces = 0;
    let invalidCityPlaces = 0;
    let batchSize = 500; // Insérer par lots de 500
    let placeBatch = [];
    
    for (const element of elements) {
      if (!element.tags) {
        skippedPlaces++;
        continue;
      }
      
      // Déterminer le nom du lieu
      const name = element.tags.name || element.tags['name:fr'] || element.tags['name:ar'] || element.tags['name:en'];
      if (!name) {
        skippedPlaces++;
        continue;
      }
      
      // Déterminer le type de lieu
      let rawType = 'unknown';
      if (element.tags.amenity) {
        rawType = element.tags.amenity;
      } else if (element.tags.shop) {
        rawType = `shop_${element.tags.shop}`;
      } else if (element.tags.tourism) {
        rawType = `tourism_${element.tags.tourism}`;
      } else if (element.tags.historic) {
        rawType = `historic_${element.tags.historic}`;
      } else if (element.tags.railway) {
        rawType = `railway_${element.tags.railway}`;
      } else if (element.tags.aeroway) {
        rawType = `aeroway_${element.tags.aeroway}`; 
      }
      
      // Simplifier le type
      const type = simplifyType(rawType);
      
      // Vérifier d'abord si le lieu est bien au Maroc selon ses coordonnées
      if (!isInMorocco(element, null)) {
        skippedPlaces++;
        continue;
      }
      
      // Déterminer la ville (à partir des tags ou par estimation)
      const city = determineCity(element);
      
      // Si on ne peut pas déterminer la ville, on ignore ce lieu
      if (!city) {
        invalidCityPlaces++;
        continue;
      }
      
      const place = {
        name: name,
        lat: element.lat,
        lon: element.lon,
        id: element.id,
        type: type,
        city: city
      };
      
      placeBatch.push(place);
      validPlaces++;
      
      // Insérer par lots pour optimiser les performances
      if (placeBatch.length >= batchSize) {
        await insertPlaces(placeBatch);
        placeBatch = [];
      }
    }
    
    // Insérer le dernier lot s'il reste des éléments
    if (placeBatch.length > 0) {
      await insertPlaces(placeBatch);
    }
    
    const endTime = performance.now();
    const executionTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Traitement terminé en ${executionTime} secondes.`);
    console.log(`- Éléments traités: ${elements.length}`);
    console.log(`- Lieux valides avec ville: ${validPlaces}`);
    console.log(`- Lieux ignorés (sans tags/nom): ${skippedPlaces}`);
    console.log(`- Lieux ignorés (ville indéterminée): ${invalidCityPlaces}`);
  } catch (error) {
    console.error('✗ Erreur lors de la récupération des données:', error.message);
    if (error.response) {
      console.error('- Statut de la réponse:', error.response.status);
      console.error('- Données de la réponse:', error.response.data);
    }
    throw error;
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage du processus d\'importation de POI pour le Maroc');
  
  try {
    // Connexion à la base de données
    await client.connect();
    console.log('✓ Connecté à PostgreSQL');
    
    // Créer la table avec tous les champs nécessaires (city NOT NULL)
    await createTable();
    
    // Récupérer et insérer les données
    await fetchPlaces();
    
    // Vérifier les statistiques finales
    const stats = await client.query('SELECT COUNT(*) as total, COUNT(DISTINCT city) as cities FROM places');
    console.log(`📊 Statistiques finales:`);
    console.log(`- Total des lieux: ${stats.rows[0].total}`);
    console.log(`- Nombre de villes distinctes: ${stats.rows[0].cities}`);
    
    const topCities = await client.query('SELECT city, COUNT(*) as count FROM places GROUP BY city ORDER BY count DESC LIMIT 10');
    console.log('- Top 10 des villes:');
    topCities.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.city}: ${row.count} lieux`);
    });
    
    const cityRegions = await client.query('SELECT city, COUNT(*) as count FROM places WHERE city LIKE \'Région%\' GROUP BY city ORDER BY count DESC');
    if (cityRegions.rows.length > 0) {
      console.log('- Répartition par régions:');
      cityRegions.rows.forEach((row, i) => {
        console.log(`  - ${row.city}: ${row.count} lieux`);
      });
    }
    
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution:', err.message);
  } finally {
    // Fermer la connexion à la base de données
    await client.end();
    console.log('✓ Connexion à la base de données fermée');
    console.log('✨ Processus terminé');
  }
}

// Lancer le programme
main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
