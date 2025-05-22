const axios = require('axios');
const { Client, types } = require('pg');
const { performance } = require('perf_hooks');
const PriorityQueue = require('priorityqueuejs');

// Liste des villes marocaines avec des rayons ajustés
const moroccanCitiesDb = [
  { name: 'Casablanca', lat: 33.5731, lon: -7.5898, radius: 0.3 },
  { name: 'Rabat', lat: 34.0209, lon: -6.8416, radius: 0.3 },
  { name: 'Marrakech', lat: 31.6295, lon: -7.9811, radius: 0.3 },
  { name: 'Fès', lat: 34.0181, lon: -5.0078, radius: 0.3 },
  { name: 'Tanger', lat: 35.7595, lon: -5.8340, radius: 0.3 },
  { name: 'Agadir', lat: 30.4278, lon: -9.5981, radius: 0.3 },
  { name: 'Meknès', lat: 33.8935, lon: -5.5547, radius: 0.3 },
  { name: 'Oujda', lat: 34.6805, lon: -1.9063, radius: 0.3 },
  { name: 'Kénitra', lat: 34.2610, lon: -6.5802, radius: 0.3 },
  { name: 'Tétouan', lat: 35.5784, lon: -5.3622, radius: 0.3 },
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
  { name: 'Guelmim', lat: 28.9864, lon: -10.0568, radius: 0.2 },
  { name: 'Berrechid', lat: 33.2655, lon: -7.5844, radius: 0.2 },
  { name: 'Chefchaouen', lat: 35.1689, lon: -5.2636, radius: 0.2 },
  { name: 'Dakhla', lat: 23.6848, lon: -15.9579, radius: 0.3 },
  { name: 'Laâyoune', lat: 27.1418, lon: -13.1872, radius: 0.3 },
  { name: 'Al Hoceima', lat: 35.2494, lon: -3.9280, radius: 0.2 },
  { name: 'Taourirt', lat: 34.4073, lon: -2.8931, radius: 0.2 },
  { name: 'Fkih Ben Salah', lat: 32.5022, lon: -6.6884, radius: 0.2 },
  { name: 'Errachidia', lat: 31.9316, lon: -4.4230, radius: 0.2 },
  { name: 'Tiznit', lat: 29.6974, lon: -9.7369, radius: 0.2 },
  { name: 'Tiflet', lat: 33.8947, lon: -6.3060, radius: 0.2 },
  { name: 'Salé', lat: 34.0531, lon: -6.7988, radius: 0.2 },
  { name: 'Benslimane', lat: 33.6185, lon: -7.1192, radius: 0.2 },
  { name: 'Temara', lat: 33.9295, lon: -6.9158, radius: 0.2 },
  { name: 'Ifrane', lat: 33.5272, lon: -5.1059, radius: 0.2 },
  { name: 'Azrou', lat: 33.4372, lon: -5.2207, radius: 0.2 },
  { name: 'Assilah', lat: 35.4646, lon: -6.0349, radius: 0.2 },
  { name: 'Tan-Tan', lat: 28.4380, lon: -11.1031, radius: 0.2 },
  { name: 'Zagora', lat: 30.3324, lon: -5.8384, radius: 0.2 },
  { name: 'Midelt', lat: 32.6852, lon: -4.7333, radius: 0.2 },
  { name: 'Région de Ouarzazate', lat: 30.75, lon: -7.3, radius: 0.5 },
  { name: 'Région du Rif', lat: 35.0, lon: -4.5, radius: 0.5 },
  { name: 'Région de l\'Atlas', lat: 31.8, lon: -6.5, radius: 0.5 },
  { name: 'Région de Souss', lat: 30.2, lon: -8.5, radius: 0.5 },
  { name: 'Région du Draa', lat: 29.7, lon: -8.0, radius: 0.5 },
  { name: 'Région du Tafilalet', lat: 31.0, lon: -4.5, radius: 0.5 },
  { name: 'Sud Marocain', lat: 28.0, lon: -10.0, radius: 0.5 },
];

// Générer des points intermédiaires entre deux villes
function generateIntermediatePoints(city1, city2, numPoints = 3) {
  const points = [];
  const latStep = (city2.lat - city1.lat) / (numPoints + 1);
  const lonStep = (city2.lon - city1.lon) / (numPoints + 1);

  for (let i = 1; i <= numPoints; i++) {
    const lat = city1.lat + latStep * i;
    const lon = city1.lon + lonStep * i;
    points.push({ name: `Intermédiaire_${city1.name}_${city2.name}_${i}`, lat, lon, radius: 0.2 });
  }

  return points;
}

// Générer tous les points à récupérer (villes + points intermédiaires)
function generateAllPoints() {
  const allPoints = [...moroccanCitiesDb];

  // Ajouter des points intermédiaires entre toutes les paires de villes
  for (let i = 0; i < moroccanCitiesDb.length; i++) {
    for (let j = i + 1; j < moroccanCitiesDb.length; j++) {
      const city1 = moroccanCitiesDb[i];
      const city2 = moroccanCitiesDb[j];
      const distance = calculateDistance(city1.lat, city1.lon, city2.lat, city2.lon);
      // Ajouter des points intermédiaires uniquement pour les villes éloignées (> 100 km)
      if (distance > 100000) { // 100 km en mètres
        const intermediatePoints = generateIntermediatePoints(city1, city2, 3);
        allPoints.push(...intermediatePoints);
      }
    }
  }

  return allPoints;
}

// Connexion à PostgreSQL
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'ma_data',
  password: 'nada1234',
  port: 5432,
});

// Création des tables
async function createTables() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS nodes (
      id BIGINT PRIMARY KEY,
      lat DOUBLE PRECISION NOT NULL,
      lon DOUBLE PRECISION NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS ways (
      id TEXT PRIMARY KEY,
      node_from BIGINT NOT NULL,
      node_to BIGINT NOT NULL,
      distance DOUBLE PRECISION NOT NULL,
      highway_type TEXT
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS city_connections (
      city_from TEXT NOT NULL,
      city_to TEXT NOT NULL,
      distance DOUBLE PRECISION NOT NULL,
      path JSONB NOT NULL,
      PRIMARY KEY (city_from, city_to)
    );
  `);
}

// Fonction pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Récupérer les données routières pour une ville ou un point donné
async function fetchRoadData(city) {
  const { name, lat, lon, radius } = city;
  console.log(`- Récupération des routes pour ${name}...`);

  // Requête Overpass pour inclure les routes tertiary pour les régions avec peu de routes principales
  const isRegion = name.startsWith('Région') || name === 'Sud Marocain';
  const highwayTypes = isRegion ? 'motorway|trunk|primary|secondary|tertiary' : 'motorway|trunk|primary|secondary';
  const overpassQuery = `
    [out:json];
    (
      way["highway"~"(${highwayTypes})"](${lat - radius},${lon - radius},${lat + radius},${lon + radius});
    );
    out body;
    >;
    out skel qt;
  `;

  let response;
  try {
    response = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error(`✗ Erreur lors de la requête Overpass pour ${name}: ${error.message}`);
    return { nodes: [], ways: [] };
  }

  const data = response.data;
  const nodes = new Map();
  const ways = [];

  // Extraire les nœuds
  data.elements
    .filter(element => element.type === 'node')
    .forEach(node => {
      nodes.set(node.id, { lat: node.lat, lon: node.lon });
    });

  // Insérer les nœuds par lots
  const nodeValues = Array.from(nodes.entries()).map(([id, { lat, lon }]) => [id, lat, lon]);
  if (nodeValues.length > 0) {
    const batchSize = 1000;
    for (let i = 0; i < nodeValues.length; i += batchSize) {
      const batch = nodeValues.slice(i, i + batchSize);
      const placeholders = batch.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(',');
      const query = `
        INSERT INTO nodes (id, lat, lon)
        VALUES ${placeholders}
        ON CONFLICT (id) DO NOTHING
      `;
      const flatValues = batch.flat();
      try {
        await client.query(query, flatValues);
      } catch (error) {
        console.error(`✗ Erreur lors de l'insertion des nœuds pour ${name}: ${error.message}`);
        return { nodes: [], ways: [] };
      }
    }
    console.log(`✓ ${nodeValues.length} nœuds insérés pour ${name}`);
  }

  // Extraire les segments de route
  data.elements
    .filter(element => element.type === 'way' && element.nodes)
    .forEach(way => {
      const highwayType = way.tags?.highway || 'unknown';
      for (let i = 0; i < way.nodes.length - 1; i++) {
        const nodeFrom = nodes.get(way.nodes[i]);
        const nodeTo = nodes.get(way.nodes[i + 1]);
        if (nodeFrom && nodeTo) {
          const distance = calculateDistance(nodeFrom.lat, nodeFrom.lon, nodeTo.lat, nodeTo.lon);
          ways.push({
            id: `${way.id}-${i}`,
            node_from: way.nodes[i],
            node_to: way.nodes[i + 1],
            distance,
            highway_type: highwayType,
          });
        }
      }
    });

  // Insérer les segments de route par lots
  if (ways.length > 0) {
    const batchSize = 1000;
    let insertedWays = 0;
    for (let i = 0; i < ways.length; i += batchSize) {
      const batch = ways.slice(i, i + batchSize);
      const placeholders = batch.map((_, index) => `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`).join(',');
      const query = `
        INSERT INTO ways (id, node_from, node_to, distance, highway_type)
        VALUES ${placeholders}
        ON CONFLICT (id) DO NOTHING
      `;
      const flatValues = batch.flatMap(way => [way.id, way.node_from, way.node_to, way.distance, way.highway_type]);
      try {
        const result = await client.query(query, flatValues);
        insertedWays += result.rowCount;
      } catch (error) {
        console.error(`✗ Erreur lors de l'insertion des segments pour ${name}: ${error.message}`);
        return { nodes: nodeValues.length, ways: insertedWays };
      }
    }
    console.log(`✓ ${insertedWays} segments de route insérés pour ${name}`);
  } else {
    console.log(`⚠ Aucun segment de route trouvé pour ${name}`);
  }

  return { nodes: nodeValues.length, ways: ways.length };
}

// Récupérer le graphe routier pour une zone donnée
async function fetchRoadGraph(startLat, startLon, endLat, endLon) {
  // Augmenter encore la taille de la boîte englobante
  const padding = 2.0; // Augmenté de 1.0 à 2.0 pour couvrir des distances plus longues
  const bbox = [
    Math.min(startLat, endLat) - padding,
    Math.min(startLon, endLon) - padding,
    Math.max(startLat, endLat) + padding,
    Math.max(startLon, endLon) + padding,
  ];

  const nodeQuery = `
    SELECT id, lat, lon
    FROM nodes
    WHERE lat >= $1 AND lat <= $3
      AND lon >= $2 AND lon <= $4;
  `;
  const nodeResult = await client.query(nodeQuery, bbox);

  const nodes = new Map();
  nodeResult.rows.forEach(node => {
    nodes.set(node.id, { lat: node.lat, lon: node.lon });
  });

  const wayQuery = `
    SELECT w.node_from, w.node_to, w.distance
    FROM ways w
    JOIN nodes n1 ON w.node_from = n1.id
    JOIN nodes n2 ON w.node_to = n2.id
    WHERE n1.lat >= $1 AND n1.lat <= $3
      AND n1.lon >= $2 AND n1.lon <= $4
      AND n2.lat >= $1 AND n2.lat <= $3
      AND n2.lon >= $2 AND n2.lon <= $4;
  `;
  const wayResult = await client.query(wayQuery, bbox);

  const graph = new Map();
  wayResult.rows.forEach(way => {
    const startNode = nodes.get(way.node_from);
    const endNode = nodes.get(way.node_to);
    if (!startNode || !endNode) return;

    const startKey = `${startNode.lat},${startNode.lon}`;
    const endKey = `${endNode.lat},${endNode.lon}`;

    if (!graph.has(startKey)) graph.set(startKey, []);
    if (!graph.has(endKey)) graph.set(endKey, []);
    graph.get(startKey).push({ to: endKey, distance: way.distance });
    graph.get(endKey).push({ to: startKey, distance: way.distance });
  });

  return { nodes, graph };
}

// Trouver le nœud le plus proche d'un point donné
function findNearestNode(lat, lon, nodes) {
  let nearestKey = null;
  let minDistance = Infinity;
  for (const [id, node] of nodes) {
    const dist = calculateDistance(lat, lon, node.lat, node.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearestKey = `${node.lat},${node.lon}`;
    }
  }
  return nearestKey;
}

// Algorithme A* pour trouver le chemin le plus court
async function aStar(startLat, startLon, endLat, endLon) {
  const { nodes, graph } = await fetchRoadGraph(startLat, startLon, endLat, endLon);

  if (nodes.size === 0) {
    throw new Error('Aucun nœud trouvé dans la zone spécifiée');
  }

  const startKey = findNearestNode(startLat, startLon, nodes);
  const endKey = findNearestNode(endLat, endLon, nodes);

  if (!startKey || !endKey) {
    throw new Error('Impossible de trouver les nœuds de départ ou d\'arrivée');
  }

  const openSet = new PriorityQueue((a, b) => fScore.get(b) - fScore.get(a));
  openSet.enq(startKey);

  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  for (const nodeKey of graph.keys()) {
    gScore.set(nodeKey, Infinity);
    fScore.set(nodeKey, Infinity);
  }

  gScore.set(startKey, 0);
  fScore.set(startKey, calculateDistance(startLat, startLon, endLat, endLon));

  while (!openSet.isEmpty()) {
    const current = openSet.deq();

    if (current === endKey) {
      const path = [];
      let currentKey = current;
      while (currentKey) {
        const [lat, lon] = currentKey.split(',').map(Number);
        path.unshift([lat, lon]);
        currentKey = cameFrom.get(currentKey);
      }
      return path;
    }

    const [currentLat, currentLon] = current.split(',').map(Number);

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      const neighborKey = neighbor.to;
      const tentativeGScore = gScore.get(current) + neighbor.distance;

      if (tentativeGScore < gScore.get(neighborKey)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + calculateDistance(
          ...neighborKey.split(',').map(Number),
          endLat,
          endLon
        ));
        openSet.enq(neighborKey);
      }
    }
  }

  throw new Error('Aucun chemin trouvé');
}

// Pré-calculer les connexions entre les villes
async function precomputeCityConnections() {
  console.log('⏳ Pré-calcul des connexions entre les villes...');
  const startTime = performance.now();
  let connectionsInserted = 0;

  for (let i = 0; i < moroccanCitiesDb.length; i++) {
    for (let j = i + 1; j < moroccanCitiesDb.length; j++) {
      const city1 = moroccanCitiesDb[i];
      const city2 = moroccanCitiesDb[j];

      try {
        const path = await aStar(city1.lat, city1.lon, city2.lat, city2.lon);
        let totalDistance = 0;
        for (let k = 0; k < path.length - 1; k++) {
          totalDistance += calculateDistance(path[k][0], path[k][1], path[k + 1][0], path[k + 1][1]);
        }

        await client.query(`
          INSERT INTO city_connections (city_from, city_to, distance, path)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (city_from, city_to) DO NOTHING
        `, [city1.name, city2.name, totalDistance, JSON.stringify(path)]);

        await client.query(`
          INSERT INTO city_connections (city_from, city_to, distance, path)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (city_from, city_to) DO NOTHING
        `, [city2.name, city1.name, totalDistance, JSON.stringify(path.reverse())]);

        connectionsInserted += 2;
        console.log(`✓ Connexion entre ${city1.name} et ${city2.name} insérée`);
      } catch (error) {
        console.error(`Erreur entre ${city1.name} et ${city2.name}: ${error.message}`);
      }
    }
  }

  const endTime = performance.now();
  console.log(`✓ ${connectionsInserted} connexions entre villes insérées`);
  console.log(`✅ Pré-calcul des connexions terminé en ${(endTime - startTime) / 1000} secondes.`);

  // Vérification spécifique pour Casablanca ↔ Tiznit
  const casablancaTiznit = await client.query(`
    SELECT * FROM city_connections
    WHERE (city_from = 'Casablanca' AND city_to = 'Tiznit')
       OR (city_from = 'Tiznit' AND city_to = 'Casablanca');
  `);
  if (casablancaTiznit.rows.length > 0) {
    console.log('✅ Connexion entre Casablanca et Tiznit trouvée dans la base de données !');
    console.log('Distance:', casablancaTiznit.rows[0].distance / 1000, 'km');
    console.log('Chemin:', casablancaTiznit.rows[0].path);
  } else {
    console.log('⚠ Aucune connexion trouvée entre Casablanca et Tiznit.');
  }
}

// Fonction principale
async function main() {
  try {
    // Connexion à la base de données
    await client.connect();
    console.log('✓ Connexion à la base de données établie');

    await createTables();

    const startTime = performance.now();
    let totalNodes = 0;
    let totalWays = 0;

    // Générer tous les points (villes + points intermédiaires)
    const allPoints = generateAllPoints();
    console.log(`📍 Total de points à récupérer (villes + intermédiaires): ${allPoints.length}`);

    // Récupérer les données routières pour chaque point
    for (const point of allPoints) {
      const { nodes, ways } = await fetchRoadData(point);
      totalNodes += nodes;
      totalWays += ways;
    }

    const endTime = performance.now();
    console.log(`✅ Récupération des données routières terminée en ${(endTime - startTime) / 1000} secondes.`);
    console.log(`- Total des nœuds insérés: ${totalNodes}`);
    console.log(`- Total des segments de route insérés: ${totalWays}`);

    // Pré-calculer les connexions entre les villes
    await precomputeCityConnections();

    // Vérifier les statistiques finales
    const nodeCount = (await client.query('SELECT COUNT(*) FROM nodes')).rows[0].count;
    const wayCount = (await client.query('SELECT COUNT(*) FROM ways')).rows[0].count;
    const connectionCount = (await client.query('SELECT COUNT(*) FROM city_connections')).rows[0].count;

    console.log('📊 Statistiques des données routières:');
    console.log(`- Total des nœuds: ${nodeCount}`);
    console.log(`- Total des segments de route: ${wayCount}`);
    console.log(`- Total des connexions entre villes: ${connectionCount}`);
  } catch (error) {
    console.error('✗ Erreur dans le processus principal:', error.message);
  } finally {
    await client.end();
    console.log('✓ Connexion à la base de données fermée');
    console.log('✨ Processus terminé');
  }
}

// Exécuter la fonction principale
main().catch(err => {
  console.error('✗ Erreur fatale:', err.message);
  process.exit(1);
});
