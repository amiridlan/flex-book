const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// The Laravel API lives in backend/ (with its own PHP vendor tree): keep Metro out of it.
const backend = /[/\\]backend[/\\].*/;
const existing = config.resolver.blockList;
config.resolver.blockList = Array.isArray(existing)
  ? [...existing, backend]
  : existing
    ? [existing, backend]
    : [backend];

module.exports = withNativeWind(config, { input: './src/global.css' });
