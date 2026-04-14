import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#000000",
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "59c3694a-212d-4365-ada3-56408e9e7189",
  });

  return tokenData.data;
}

export async function sendPushTokenToServer(token: string): Promise<void> {
  try {
    await api.put("/users/me/push-token", { push_token: token });
  } catch (e) {
    // Silent fail - non-critical
  }
}

export async function removePushTokenFromServer(): Promise<void> {
  try {
    await api.delete("/users/me/push-token");
  } catch (e) {
    // Silent fail
  }
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
