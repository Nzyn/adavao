import { API_URL } from '../config/backend';

type SseHandle = {
  close: () => void;
};

type UpdateHandler = () => void;

function getEventSourceImpl() {
  if (typeof EventSource !== 'undefined') return EventSource;
  try {
    // react-native-sse exports EventSource as default or module itself
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-sse');
    return mod?.default || mod;
  } catch {
    return null;
  }
}

export function createSseConnection(onUpdate: UpdateHandler): SseHandle {
  const url = `${API_URL}/stream`;
  const EventSourceImpl = getEventSourceImpl();
  let source: any = null;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let fallbackTimer: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (source) {
      try {
        source.close();
      } catch {
        // ignore
      }
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
      // Fallback to polling if SSE is not available in this runtime
      fallbackTimer = setInterval(() => {
        if (!closed) onUpdate();
      }, 10000);
      return;
    }

    try {
      source = new EventSourceImpl(url);
      if (source?.addEventListener) {
        source.addEventListener('update', () => onUpdate());
        source.addEventListener('tick', () => onUpdate());
      } else if (source?.onmessage !== undefined) {
        source.onmessage = () => onUpdate();
      }

      source.onerror = () => {
        if (closed) return;
        scheduleReconnect();
      };
    } catch {
      scheduleReconnect();
    }
  };

  connect();

  return {
    close: () => {
      closed = true;
      cleanup();
    },
  };
}