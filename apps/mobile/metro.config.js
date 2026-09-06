const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite uses a WebAssembly worker in the browser. Metro does not treat
// .wasm as an asset unless it is explicitly registered.
config.resolver.assetExts.push('wasm');

module.exports = config;
