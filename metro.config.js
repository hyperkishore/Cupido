const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  port: Number(process.env.EXPO_DEV_SERVER_PORT || process.env.PORT || 8081),
};

module.exports = config;
