import { Share, Platform, Alert } from 'react-native';

const DEEP_LINK_SCHEME = 'clublms://';

export function getEventDeepLink(eventId: string): string {
  return `${DEEP_LINK_SCHEME}event/${eventId}`;
}

export async function copyEventLink(eventId: string): Promise<void> {
  const link = getEventDeepLink(eventId);
  try {
    const Clipboard = require('expo-clipboard');
    await Clipboard.setStringAsync(link);
  } catch {
    // Fallback: share via system share sheet if clipboard module unavailable
    await Share.share({ message: link });
  }
}

export async function shareEventViaSystem(title: string, eventId: string): Promise<void> {
  const link = getEventDeepLink(eventId);
  await Share.share({
    message: Platform.OS === 'android' ? `${title}\n${link}` : link,
    title,
    url: Platform.OS === 'ios' ? link : undefined,
  });
}
