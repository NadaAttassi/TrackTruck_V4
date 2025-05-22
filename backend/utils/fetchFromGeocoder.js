const axios = require('axios');
const delay = require('./delay');

const fetchFromGeocoder = async (url, retries = 3, delayMs = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 10000, // 10-second timeout
      });
      // Check if the response is valid GeoJSON with features
      if (!response.data || !response.data.features || !Array.isArray(response.data.features)) {
        throw new Error('Photon response is invalid: ' + JSON.stringify(response.data));
      }
      return response;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 429 && i < retries - 1) {
          console.log(`Photon 429 error, retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
          await delay(delayMs);
          continue;
        }
        console.error(`Photon error: Status ${error.response.status}, Response: ${JSON.stringify(error.response.data)}`);
        throw new Error(`Photon request failed with status ${error.response.status}`);
      }
      console.error(`Photon request failed: ${error.message}`);
      if (i === retries - 1) {
        throw new Error('Max retries reached for Photon request: ' + error.message);
      }
      await delay(delayMs);
    }
  }
};

module.exports = fetchFromGeocoder;
