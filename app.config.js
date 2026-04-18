// Expo loads .env and .env.local before this file runs, so process.env is available.
const baseConfig = require('./app.json');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const variant = process.env.APP_VARIANT;

const isDev = variant === 'development';

// Deep clone to avoid mutating the required module cache
const config = JSON.parse(JSON.stringify(baseConfig));

if (config.expo.android?.config?.googleMaps) {
  config.expo.android.config.googleMaps.apiKey = googleMapsApiKey;
}

if (isDev) {
  config.expo.name = 'AERIS Dev';
  config.expo.android.package = 'com.aeris.app.dev';
}

module.exports = config;
