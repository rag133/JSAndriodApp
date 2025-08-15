const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import("@react-native/metro-config").MetroConfig}
 */
const config = {
  resolver: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  watchFolders: [
    path.resolve(__dirname, "../shared"),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
