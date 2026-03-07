import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import logger from './logger';

// ─── Global Network State ───
let isOnline = true;
let networkListeners = [];

/**
 * Subscribe to network state changes
 * @param {Function} callback - Called with { isConnected: boolean }
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNetworkChanges = (callback) => {
  const unsubscribe = NetInfo.addEventListener(state => {
    const wasOnline = isOnline;
    isOnline = state.isConnected;

    if (wasOnline !== isOnline) {
      logger.info('Network status changed', { isOnline });
      callback({ isConnected: isOnline });
    }
  });

  return unsubscribe;
};

/**
 * Get current network status
 * @returns {Promise<boolean>} true if online
 */
export const checkNetworkStatus = async () => {
  try {
    const state = await NetInfo.fetch();
    isOnline = state.isConnected;
    logger.info('Network status checked', { isOnline });
    return isOnline;
  } catch (e) {
    logger.error('Failed to check network status', { error: e.message });
    return isOnline; // Return last known state
  }
};

/**
 * Is app currently online?
 * @returns {boolean}
 */
export const isAppOnline = () => {
  return isOnline;
};

/**
 * React Hook to monitor network changes
 * @param {Function} onOnline - Called when connection restored
 * @param {Function} onOffline - Called when connection lost
 */
export const useNetworkStatus = (onOnline, onOffline) => {
  const [connected, setConnected] = useState(isOnline);

  useEffect(() => {
    checkNetworkStatus();

    const unsubscribe = subscribeToNetworkChanges(({ isConnected }) => {
      setConnected(isConnected);

      if (isConnected && !connected) {
        logger.info('App came online');
        onOnline?.();
      } else if (!isConnected && connected) {
        logger.warn('App went offline');
        onOffline?.();
      }
    });

    return unsubscribe;
  }, [connected, onOnline, onOffline]);

  return connected;
};

export default {
  subscribeToNetworkChanges,
  checkNetworkStatus,
  isAppOnline,
  useNetworkStatus,
};
