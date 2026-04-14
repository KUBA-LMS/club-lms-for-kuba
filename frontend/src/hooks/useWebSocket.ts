/**
 * React hooks for WebSocket integration.
 *
 * - useWebSocketConnection: call once at app root, manages connect/disconnect lifecycle
 * - useChannel: subscribe to a channel while the component is mounted
 * - useUserChannel: shorthand for the user's personal channel
 */

import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import config from "../config";
import { useAuth } from "../context/AuthContext";
import { wsService } from "../services/websocket";

type MessageHandler = (data: Record<string, unknown>) => void;

/**
 * Manages the WebSocket connection lifecycle.
 * Call once in the app root (e.g. MainNavigator).
 * Connects when authenticated, disconnects on logout.
 * Reconnects when app returns from background.
 */
export function useWebSocketConnection(): void {
  const { accessToken, isAuthenticated } = useAuth();
  const prevTokenRef = useRef<string | null>(null);

  // Handle connect/disconnect based on auth state changes
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      if (prevTokenRef.current !== accessToken) {
        // connect() internally cleans up the old WS connection while
        // preserving channels/listeners, so _resubscribe() restores them.
        wsService.connect(config.WS_URL, accessToken);
        prevTokenRef.current = accessToken;
      }
    } else {
      // Logout: full disconnect (clears channels + listeners)
      wsService.disconnect();
      prevTokenRef.current = null;
    }
    // No cleanup here - disconnect on unmount is handled by the separate effect below.
    // If we put disconnect() in cleanup, it fires on every token change and
    // clears channels/listeners before connect() can preserve them.
  }, [isAuthenticated, accessToken]);

  // Disconnect only on actual component unmount
  useEffect(() => {
    return () => {
      wsService.disconnect();
      prevTokenRef.current = null;
    };
  }, []);

  // Reconnect on foreground return
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === "active" && isAuthenticated && accessToken) {
        if (!wsService.isConnected) {
          wsService.connect(config.WS_URL, accessToken);
        }
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [isAuthenticated, accessToken]);
}

/**
 * Subscribe to a WS channel while the component is mounted.
 * Automatically subscribes/unsubscribes on mount/unmount.
 *
 * @param channel - Channel name (e.g. "event:uuid", "event:uuid:admin")
 * @param handler - Called when a message arrives on this channel
 */
export function useChannel(
  channel: string | null | undefined,
  handler: MessageHandler,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!channel) return;

    wsService.subscribe(channel);
    const unsub = wsService.on(channel, (data) => handlerRef.current(data));

    return () => {
      unsub();
      wsService.unsubscribe(channel);
    };
  }, [channel]);
}

/**
 * Subscribe to the current user's personal channel (user:{id}).
 * Receives registration_changed and other personal notifications.
 */
export function useUserChannel(handler: MessageHandler): void {
  const { user } = useAuth();
  const userId = (user as { id?: string } | null)?.id;
  const channel = userId ? `user:${userId}` : null;
  useChannel(channel, handler);
}
