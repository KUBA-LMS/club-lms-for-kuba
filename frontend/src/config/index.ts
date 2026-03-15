/**
 * Application configuration.
 *
 * SECURITY WARNING:
 *   API_URL and other sensitive configs should be set via environment variables.
 *   Default values are for development only.
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // In dev mode, detect Metro host IP for physical device support
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(":")[0];
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        return `http://${host}:8000/api/v1`;
      }
    }
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000/api/v1";
  }
  return "http://localhost:8000/api/v1";
};

const getWsUrl = () => {
  const api = getApiUrl();
  return api.replace(/^http/, "ws") + "/ws";
};

const config = {
  API_URL: getApiUrl(),
  WS_URL: getWsUrl(),
  // Token storage keys
  ACCESS_TOKEN_KEY: "@club_lms_access_token",
  REFRESH_TOKEN_KEY: "@club_lms_refresh_token",
  USER_KEY: "@club_lms_user",
  // Request timeout (ms)
  REQUEST_TIMEOUT: 30000,
};

export default config;
