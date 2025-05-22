const pool = require('../db');

// Vérifier si un itinéraire est déjà en cache
async function checkCachedRoutes(startLat, startLon, endLat, endLon) {
  try {
    const query = `
      SELECT route_data 
      FROM cached_routes 
      WHERE start_lat = $1 AND start_lon = $2 AND end_lat = $3 AND end_lon = $4
      LIMIT 10
    `;
    const values = [startLat, startLon, endLat, endLon];
    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      console.log('Itinéraires trouvés dans le cache:', result.rows.length);
      return result.rows.map(row => row.route_data);
    }
    return [];
  } catch (error) {
    console.error('Erreur lors de la vérification du cache:', error.message);
    return [];
  }
}

// Insérer un itinéraire dans le cache
async function cacheRoutes(startLat, startLon, endLat, endLon, routes) {
  try {
    for (const route of routes) {
      const query = `
        INSERT INTO cached_routes (start_lat, start_lon, end_lat, end_lon, route_data)
        VALUES ($1, $2, $3, $4, $5)
      `;
      const values = [startLat, startLon, endLat, endLon, route];
      await pool.query(query, values);
    }
    console.log('Itinéraires insérés dans le cache PostgreSQL:', routes.length);
  } catch (error) {
    console.error('Erreur lors de l\'insertion dans le cache:', error.message);
  }
}

module.exports = { checkCachedRoutes, cacheRoutes };
