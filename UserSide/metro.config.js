const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for nanoid and other module resolution issues
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

// Ignore problematic patterns
config.resolver.blockList = [
  ...config.resolver.blockList,
  /.*node_modules\/@supabase\/postgrest-js\/.*/,
];

// Handle module extensions properly
config.resolver.extensions = [
  '.web.js',
  '.web.jsx',
  '.web.ts',
  '.web.tsx',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.native.js',
  '.native.jsx',
  '.native.ts',
  '.native.tsx',
];

module.exports = config;
