const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];

config.resolver = {
  ...config.resolver,
  blockList: [
    /\.local\/.*/,
    /\.git\/.*/,
    /\.agents\/.*/,
  ],
};

module.exports = config;
