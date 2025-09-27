const Module = require('module');

const originalRequire = Module.prototype.require;

Module.prototype.require = function mockExpoSqlite(request) {
  if (request === 'expo-sqlite') {
    return {
      openDatabaseAsync: async () => ({
        execAsync: async () => undefined,
        runAsync: async () => undefined,
        getAllAsync: async () => [],
        getFirstAsync: async () => undefined,
        closeAsync: async () => undefined,
      }),
    };
  }
  return originalRequire.call(this, request);
};

module.exports = { restore() { Module.prototype.require = originalRequire; } };
