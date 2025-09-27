const Module = require('module');
const originalRequire = Module.prototype.require;

const store = new Map();

Module.prototype.require = function mockAsyncStorage(request) {
  if (request === '@react-native-async-storage/async-storage') {
    return {
      setItem: async (key, value) => {
        store.set(key, String(value));
      },
      getItem: async (key) => (store.has(key) ? store.get(key) : null),
      removeItem: async (key) => {
        store.delete(key);
      },
      clear: async () => {
        store.clear();
      },
    };
  }
  return originalRequire.call(this, request);
};

module.exports = {
  restore() {
    Module.prototype.require = originalRequire;
  },
};
