/**
 * Application configuration.
 *
 * SECURITY WARNING:
 *   API_URL and other sensitive configs should be set via environment variables.
 *   Default values are for development only.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to access host machine's localhost
const getDevApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8002/api/v1';
  }
  return 'http://localhost:8002/api/v1';
};

const ENV = {
  dev: {
    API_URL: getDevApiUrl(),
  },
  staging: {
    API_URL: 'https://staging-api.example.com/api/v1',
  },
  prod: {
    API_URL: 'https://api.example.com/api/v1',
  },
};

type Environment = 'dev' | 'staging' | 'prod';

function getEnvVars(): typeof ENV.dev {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel as Environment | undefined;

  if (releaseChannel === 'staging') {
    return ENV.staging;
  }
  if (releaseChannel === 'prod') {
    return ENV.prod;
  }

  // Dev environment - use platform-aware URL
  return ENV.dev;
}

const config = {
  ...getEnvVars(),
  // Token storage keys
  ACCESS_TOKEN_KEY: '@club_lms_access_token',
  REFRESH_TOKEN_KEY: '@club_lms_refresh_token',
  USER_KEY: '@club_lms_user',
  // Request timeout (ms)
  REQUEST_TIMEOUT: 30000,
};

export default config;
