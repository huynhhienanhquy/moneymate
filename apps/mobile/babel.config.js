const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin');

module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // npm hoists babel-preset-expo to the monorepo root while expo-router stays
    // in this workspace. Enable the bundled Router transform explicitly so the
    // preset does not depend on finding expo-router beside its own package.
    plugins: [expoRouterBabelPlugin],
  };
};
