const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite
config.resolver = {
  ...config.resolver,
  assetExts: [...(config.resolver?.assetExts || []), 'wasm'],
  sourceExts: [...(config.resolver?.sourceExts || [])],
};

config.server = {
  ...config.server,
  port: Number(process.env.EXPO_DEV_SERVER_PORT || process.env.PORT || 8081),
};

module.exports = config;
