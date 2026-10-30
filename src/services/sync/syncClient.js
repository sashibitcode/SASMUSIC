import Paho from 'paho-mqtt';

/**
 * Public high-availability MQTT WebSocket broker endpoints
 * Primary: HiveMQ Public Broker
 * Secondary / Failover: EMQX Public Broker
 */
const BROKER_SERVERS = [
  { host: 'broker.hivemq.com', port: 8884, path: '/mqtt', ssl: true, name: 'HiveMQ' },
  { host: 'broker.emqx.io', port: 8084, path: '/mqtt', ssl: true, name: 'EMQX' }
];

export class SyncClient {
  constructor(roomCode, user) {
    this.roomCode = String(roomCode).trim();
    this.user = user; // { userId, userName, isHost, avatarColor }
    this.activeServerIndex = 0;
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.isDestroyed = false;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 10000;
    this.reconnectTimer = null;
    this.presenceTimer = null;

    // Callbacks
    this.onStateCallbacks = new Set();
    this.onActionCallbacks = new Set();
    this.onPresenceCallbacks = new Set();
    this.onStatusChangeCallbacks = new Set();

    // BroadcastChannel for instant zero-latency same-browser multi-tab sync
    this.broadcastChannel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(`sas_syncplay_${this.roomCode}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingPayload(event.data?.topic, event.data?.payload);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or blocked:', e);
      }
    }
  }

  get stateTopic() {
    return `sasmusic/v1/room/${this.roomCode}/state`;
  }

  get actionTopic() {
    return `sasmusic/v1/room/${this.roomCode}/action`;
  }

  get presenceTopicPrefix() {
    return `sasmusic/v1/room/${this.roomCode}/presence/`;
  }

  get myPresenceTopic() {
    return `${this.presenceTopicPrefix}${this.user.userId}`;
  }

  get wildcardTopic() {
    return `sasmusic/v1/room/${this.roomCode}/#`;
  }

  connect() {
    if (this.isDestroyed || this.isConnected || this.isConnecting) return;

    this.isConnecting = true;
    this.emitStatus('CONNECTING');

    const server = BROKER_SERVERS[this.activeServerIndex];
    const clientId = `sas_${this.user.userId.slice(0, 6)}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const ClientConstructor = Paho.Client || Paho;
      this.client = new ClientConstructor(
        server.host,
        server.port,
        server.path,
        clientId
      );

      this.client.onConnectionLost = (responseObject) => {
        this.isConnected = false;
        this.isConnecting = false;
        if (!this.isDestroyed) {
          console.warn(`[SyncPlay] Lost connection to ${server.name}:`, responseObject?.errorMessage);
          this.emitStatus('RECONNECTING');
          this.scheduleReconnect();
        }
      };

      this.client.onMessageArrived = (message) => {
        try {
          const topic = message.destinationName;
          const payload = JSON.parse(message.payloadString);
          this.handleIncomingPayload(topic, payload);
        } catch (err) {
          console.warn('[SyncPlay] Error parsing message payload:', err);
        }
      };

      this.client.connect({
        useSSL: server.ssl,
        timeout: 6,
        keepAliveInterval: 30,
        cleanSession: true,
        onSuccess: () => {
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emitStatus('CONNECTED');

          // Subscribe to all room updates (state, action, presence)
          this.client.subscribe(this.wildcardTopic, { qos: 0 });

          // Start heartbeat presence
          this.startPresenceHeartbeat();
        },
        onFailure: (err) => {
          this.isConnected = false;
          this.isConnecting = false;
          console.warn(`[SyncPlay] Failed connecting to ${server.name}:`, err?.errorMessage);

          // Cycle to next broker
          this.activeServerIndex = (this.activeServerIndex + 1) % BROKER_SERVERS.length;
          if (!this.isDestroyed) {
            this.emitStatus('RECONNECTING');
            this.scheduleReconnect();
          }
        }
      });
    } catch (err) {
      this.isConnecting = false;
      this.isConnected = false;
      console.warn('[SyncPlay] Client setup error:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.isDestroyed || this.reconnectTimer) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isDestroyed && !this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  startPresenceHeartbeat() {
    this.stopPresenceHeartbeat();

    // Send immediate presence announcement
    this.publishPresence();

    // Ping every 4 seconds
    this.presenceTimer = setInterval(() => {
      if (this.isConnected && !this.isDestroyed) {
        this.publishPresence();
      }
    }, 4000);
  }

  stopPresenceHeartbeat() {
    if (this.presenceTimer) {
      clearInterval(this.presenceTimer);
      this.presenceTimer = null;
    }
  }

  publishPresence(status = 'active') {
    const payload = {
      userId: this.user.userId,
      userName: this.user.userName,
      isHost: this.user.isHost,
      avatarColor: this.user.avatarColor,
      status,
      timestamp: Date.now()
    };

    this.publishToTopic(this.myPresenceTopic, payload, false);
  }

  /**
   * Host publishes full authoritative room state (retained so newcomers get it immediately)
   */
  publishState(state) {
    const payload = {
      ...state,
      hostId: this.user.userId,
      hostName: this.user.userName,
      hostTime: Date.now()
    };
    this.publishToTopic(this.stateTopic, payload, true);
  }

  /**
   * Host or members publish transient playback action (PLAY, PAUSE, SEEK, CHANGE_SONG, ROOM_CLOSED)
   */
  publishAction(action) {
    const payload = {
      ...action,
      senderId: this.user.userId,
      senderName: this.user.userName,
      hostTime: Date.now()
    };
    this.publishToTopic(this.actionTopic, payload, false);
  }

  publishToTopic(topic, payload, retained = false) {
    // 1. Broadcast locally across same-origin tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ topic, payload });
      } catch (_) {}
    }

    // 2. Publish via WebSocket broker
    if (this.client && this.isConnected) {
      try {
        const MessageConstructor = Paho.Message || Paho;
        const message = new MessageConstructor(JSON.stringify(payload));
        message.destinationName = topic;
        message.retained = retained;
        message.qos = 0;
        this.client.send(message);
      } catch (err) {
        console.warn(`[SyncPlay] Failed to publish to ${topic}:`, err);
      }
    }
  }

  handleIncomingPayload(topic, payload) {
    if (!topic || !payload) return;

    if (topic === this.stateTopic) {
      this.onStateCallbacks.forEach((cb) => {
        try { cb(payload); } catch (e) { console.error(e); }
      });
    } else if (topic === this.actionTopic) {
      this.onActionCallbacks.forEach((cb) => {
        try { cb(payload); } catch (e) { console.error(e); }
      });
    } else if (topic.startsWith(this.presenceTopicPrefix)) {
      this.onPresenceCallbacks.forEach((cb) => {
        try { cb(payload); } catch (e) { console.error(e); }
      });
    }
  }

  onState(cb) {
    this.onStateCallbacks.add(cb);
    return () => this.onStateCallbacks.delete(cb);
  }

  onAction(cb) {
    this.onActionCallbacks.add(cb);
    return () => this.onActionCallbacks.delete(cb);
  }

  onPresence(cb) {
    this.onPresenceCallbacks.add(cb);
    return () => this.onPresenceCallbacks.delete(cb);
  }

  onStatusChange(cb) {
    this.onStatusChangeCallbacks.add(cb);
    return () => this.onStatusChangeCallbacks.delete(cb);
  }

  emitStatus(status) {
    this.onStatusChangeCallbacks.forEach((cb) => {
      try { cb(status); } catch (e) { console.error(e); }
    });
  }

  disconnect() {
    this.isDestroyed = true;
    this.stopPresenceHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Announce departure
    try {
      this.publishPresence('left');
    } catch (_) {}

    if (this.client) {
      try {
        if (this.isConnected) {
          this.client.disconnect();
        }
      } catch (_) {}
      this.client = null;
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (_) {}
      this.broadcastChannel = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.emitStatus('DISCONNECTED');
    this.onStateCallbacks.clear();
    this.onActionCallbacks.clear();
    this.onPresenceCallbacks.clear();
    this.onStatusChangeCallbacks.clear();
  }
}

