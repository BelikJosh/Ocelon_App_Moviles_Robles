// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Si ya usas otros plugins (ej. module-resolver, expo-router),
      // déjalos aquí arriba.
      'react-native-reanimated/plugin', // 👈 SIEMPRE va al final
    ],
  };
};
