const { withInfoPlist, withAndroidManifest, withProjectBuildGradle } = require('@expo/config-plugins');
const path = require('path');

// Load .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const NAVER_CLIENT_ID = process.env.NAVER_MAP_CLIENT_ID;

if (!NAVER_CLIENT_ID) {
  console.warn('Warning: NAVER_MAP_CLIENT_ID is not set in .env file');
}

function withNaverMapIOS(config) {
  return withInfoPlist(config, (config) => {
    if (NAVER_CLIENT_ID) {
      config.modResults.NMFNcpKeyId = NAVER_CLIENT_ID;
    }
    return config;
  });
}

function withNaverMapAndroid(config) {
  return withAndroidManifest(config, (config) => {
    if (!NAVER_CLIENT_ID) return config;

    const mainApplication = config.modResults.manifest.application[0];

    if (!mainApplication['meta-data']) {
      mainApplication['meta-data'] = [];
    }

    // Remove existing Naver Map key if present
    mainApplication['meta-data'] = mainApplication['meta-data'].filter(
      (item) => item.$?.['android:name'] !== 'com.naver.maps.map.NCP_KEY_ID'
    );

    // Add Naver Map client ID
    mainApplication['meta-data'].push({
      $: {
        'android:name': 'com.naver.maps.map.NCP_KEY_ID',
        'android:value': NAVER_CLIENT_ID,
      },
    });

    return config;
  });
}

function withNaverMapMavenRepository(config) {
  return withProjectBuildGradle(config, (config) => {
    const naverMavenRepo = "maven { url 'https://repository.map.naver.com/archive/maven' }";

    // Check if already added
    if (config.modResults.contents.includes('repository.map.naver.com')) {
      return config;
    }

    // Add Naver Maven repository to allprojects > repositories
    config.modResults.contents = config.modResults.contents.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      `allprojects {\n  repositories {\n    ${naverMavenRepo}`
    );

    return config;
  });
}

module.exports = function withNaverMap(config) {
  config = withNaverMapIOS(config);
  config = withNaverMapAndroid(config);
  config = withNaverMapMavenRepository(config);
  return config;
};
