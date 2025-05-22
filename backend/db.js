const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'nada1234',
  database: process.env.DB_NAME || 'ma_data',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
});

const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.connect();
      console.log('Connecté à la base de données PostgreSQL');
      return;
    } catch (err) {
      console.error(`Erreur de connexion à la base de données (tentative ${i + 1}/${retries}):`, err.stack);
      if (i === retries - 1) {
        console.error('Impossible de se connecter à la base de données. Arrêt du serveur.');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

connectWithRetry();

module.exports = pool;
