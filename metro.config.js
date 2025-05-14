const { getDefaultConfig } = require('@expo/metro-config');
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs'); // Hoặc 'mjs' tùy thuộc vào lỗi bạn gặp
config.resolver.unstable_enablePackageExports = false; // Có thể cần thiết

module.exports = config;