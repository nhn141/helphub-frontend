import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import * as encoding from 'text-encoding';

import { API_BASE_URL } from '@/components/auth/auth-api';

const { TextEncoder, TextDecoder } = encoding as any;
const globalWithEncoding = globalThis as any;

if (!globalWithEncoding.TextEncoder && TextEncoder) {
  globalWithEncoding.TextEncoder = TextEncoder;
}

if (!globalWithEncoding.TextDecoder && TextDecoder) {
  globalWithEncoding.TextDecoder = TextDecoder;
}

export type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'disconnected';

type StoredSubscription = {
  destination: string;
  callback: (frame: StompFrame) => void;
  stompSubscription?: StompSubscription;
};

class ChatRealtimeClient {
  private client: Client | null = null;
  private token: string | null = null;
  private connected = false;
  private connecting = false;
  private subscriptions = new Map<string, StoredSubscription>();
  private statusListeners = new Map<string, (status: RealtimeConnectionStatus) => void>();
  private errorListeners = new Map<string, (message: string) => void>();
  private subCounter = 0;
  private listenerCounter = 0;

  isConnected() {
    return this.connected;
  }

  addStatusListener(callback: (status: RealtimeConnectionStatus) => void) {
    const id = `status-${this.listenerCounter++}`;
    this.statusListeners.set(id, callback);

    return id;
  }

  removeStatusListener(id: string) {
    this.statusListeners.delete(id);
  }

  addErrorListener(callback: (message: string) => void) {
    const id = `error-${this.listenerCounter++}`;
    this.errorListeners.set(id, callback);

    return id;
  }

  removeErrorListener(id: string) {
    this.errorListeners.delete(id);
  }

  connect(token: string) {
    if (this.connected && this.token === token) {
      this.emitStatus('connected');
      return;
    }

    if (this.connecting && this.token === token) {
      this.emitStatus('connecting');
      return;
    }

    this.token = token;
    this.connected = false;
    this.connecting = true;
    this.emitStatus('connecting');
    this.createClient(token);
    this.client?.activate();
  }

  subscribe(destination: string, callback: (frame: StompFrame) => void) {
    const subId = `sub-${this.subCounter++}`;
    const subscription: StoredSubscription = { destination, callback };
    this.subscriptions.set(subId, subscription);

    if (this.connected) {
      this.activateSubscription(subId, subscription);
    }

    return subId;
  }

  unsubscribe(subId: string) {
    const subscription = this.subscriptions.get(subId);

    if (subscription?.stompSubscription) {
      try {
        subscription.stompSubscription.unsubscribe();
      } catch (error) {
        console.error('[STOMP] Failed to unsubscribe:', error);
      }
    }

    this.subscriptions.delete(subId);

    if (this.subscriptions.size === 0) {
      this.disconnect();
    }
  }

  disconnect() {
    this.token = null;
    this.connected = false;
    this.connecting = false;

    this.subscriptions.forEach((subscription) => {
      subscription.stompSubscription = undefined;
    });

    if (this.client) {
      const client = this.client;
      this.client = null;
      void client.deactivate();
    }

    this.emitStatus('disconnected');
  }

  private createClient(token: string) {
    if (this.client) {
      const previousClient = this.client;
      this.client = null;
      void previousClient.deactivate();
    }

    const brokerUrl = buildWebSocketUrl();
    const client = new Client({
      webSocketFactory: () => new WebSocket(brokerUrl) as any,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      forceBinaryWSFrames: false,
      appendMissingNULLonIncoming: false,
      reconnectDelay: 1000,
      connectionTimeout: 8000,
      debug: () => {},
      beforeConnect: () => {
        if (this.client === client) {
          this.emitStatus('connecting');
        }
      },
      onConnect: () => {
        if (this.client !== client) {
          return;
        }

        this.connected = true;
        this.connecting = false;
        this.resubscribeAll();
        this.emitStatus('connected');
      },
      onDisconnect: () => {
        if (this.client !== client) {
          return;
        }

        this.markDisconnected();
      },
      onStompError: (frame) => {
        if (this.client !== client) {
          return;
        }

        const message =
          frame.body || frame.headers.message || 'Realtime connection error.';
        this.markDisconnected();
        this.emitError(message);
      },
      onWebSocketError: () => {
        if (this.client === client) {
          this.emitError('Realtime connection error.');
        }
      },
      onWebSocketClose: () => {
        if (this.client !== client) {
          return;
        }

        this.markDisconnected();
      },
    });

    this.client = client;
  }

  private activateSubscription(subId: string, subscription: StoredSubscription) {
    if (!this.client || subscription.stompSubscription) {
      return;
    }

    subscription.stompSubscription = this.client.subscribe(
      subscription.destination,
      (message: IMessage) => {
        subscription.callback({
          command: 'MESSAGE',
          headers: message.headers as Record<string, string>,
          body: message.body,
        });
      },
      {
        id: subId,
        ack: 'auto',
      }
    );
  }

  private resubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.stompSubscription = undefined;
    });

    this.subscriptions.forEach((subscription, subId) => {
      this.activateSubscription(subId, subscription);
    });
  }

  private markDisconnected() {
    this.connected = false;
    this.connecting = false;
    this.subscriptions.forEach((subscription) => {
      subscription.stompSubscription = undefined;
    });
    this.emitStatus('disconnected');
  }

  private emitStatus(status: RealtimeConnectionStatus) {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch {}
    });
  }

  private emitError(message: string) {
    this.errorListeners.forEach((listener) => {
      try {
        listener(message);
      } catch {}
    });
  }
}

function buildWebSocketUrl() {
  const apiRoot = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${apiRoot.replace(/^http/i, 'ws')}/ws`;
}

export const chatRealtimeClient = new ChatRealtimeClient();
