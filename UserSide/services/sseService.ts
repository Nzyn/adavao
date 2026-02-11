import { API_URL } from '../config/backend';
import { AppState, AppStateStatus } from 'react-native';

type SseHandle = {
  close: () => void;
};

type UpdateHandler = () => void;

// ---------- Global refresh event bus ----------
const listeners = new Set<() => void>();
let refreshCounter = 0;

/** Register a callback that fires whenever SSE detects a data change.
 *  Returns an unsubscribe function. */
export function onDataRefresh(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function getRefreshCounter(): number {
  return refreshCounter;
}

function emitRefresh() {
  refreshCounter++;
  listeners.forEach((cb) => {
    try { cb(); } catch { /* ignore */ }
  });
}

// ---------- SSE + polling connection ----------

function getEventSourceImpl() {
  if (typeof EventSource !== 'undefined') return EventSource;
  try {
    const mod = require('react-native-sse');
    return mod?.default || mod;
  } catch {
    return null;
  }
}

export function createSseConnection(onUpdate?: UpdateHandler): SseHandle {
  const url = `${API_URL}/stream`;
  const EventSourceImpl = getEventSourceImpl();
  let source: any = null;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let fallbackTimer: ReturnType<typeof setInterval> | null = null;
  let appStateSubscription: any = null;
  let lastEmit = 0;
  const THROTTLE_MS = 2000;

  const notify = () => {
    const now = Date.now();
    if (now - lastEmit < THROTTLE_MS) return;
    lastEmit = now;
    emitRefresh();
    if (onUpdate) onUpdate();
  };

  const cleanup = () => {
    if (source) {
      try { source.close(); } catch { /* ignore */ }
      source = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (fallbackTimer) {
      clearInterval(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 5000);
  };

  const connect = () => {
    if (closed) return;
    cleanup();

    if (!EventSourceImpl) {
      // Fallback to polling if SSE is not available
      fallbackTimer = setInterval(() => {
        if (!closed) notify();
      }, 10000);
      return;
    }

    try {
      source = new EventSourceImpl(url);
      if (source?.addEventListener) {
        source.addEventListener('update', () => notify());
        // Don't fire on every tick - tick is just a keep-alive
      } else if (source?.onmessage !== undefined) {
        source.onmessage = () => notify();
      }

      source.onerror = () => {
        if (closed) return;
        scheduleReconnect();
      };
    } catch {
      scheduleReconnect();
    }
  };

  // Reconnect when app comes to foreground
  appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (closed) return;
    if (state === 'active') {
      if (!source || (source.readyState && source.readyState === 2)) {
        connect();
      }
      notify();
    }
  });

  connect();

  return {
    close: () => {
      closed = true;
      cleanup();
      if (appStateSubscription) {
        appStateSubscription.remove();
        appStateSubscription = null;
      }
    },
  };
}