const URL = "https://api.falbue.ru";

async function getServer() {
  try {
    const response = await fetch(`${URL}/servers/`);
    if (!response.ok) {
      console.log(`Ошибка при получении серверов: ${response.status}`);
      return { address: "127.0.0.1", port: 3000 };
    }
    const servers = await response.json();
    return servers[0];
  } catch (error) {
    console.warn("Не удалось подключиться к серверу:", error.message);
    return { address: "127.0.0.1", port: 3000 };
  }
}

export class ChatWebSocket {
  constructor(roomId, userData, typeRoom) {
    this.roomId = roomId;
    this.userData = userData;
    this.typeRoom = typeRoom;
    this.ws = null;
    this.handlers = new Map();
    this.destroyed = false;
  }

  async connect() {
    const server = await getServer();
    if (this.destroyed) {
      console.log("ChatWebSocket: connect отменён, объект уже уничтожен");
      return this;
    }

    const prefix = server.address === "127.0.0.1" ? "ws" : "wss";
    const wsUrl = `${prefix}://${server.address}:${server.port}/${this.typeRoom}/${this.roomId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      if (this.destroyed) {
        this.ws.close();
        return;
      }
      this.send({ user: { ...this.userData }, type: "welcome" });
    };

    this.ws.onmessage = (event) => {
      if (this.destroyed) return;
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (error) {
        console.error("Ошибка разбора сообщения WebSocket:", error);
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket ошибка:", err);
    };

    return this;
  }

  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
    return this;
  }

  handleMessage(msg) {
    const handlers = this.handlers.get(msg.type) || [];
    handlers.forEach((handler) => handler(msg));

    if (
      msg.username !== undefined &&
      msg.text !== undefined &&
      !this.handlers.has(msg.type)
    ) {
      const defaultHandlers = this.handlers.get("message") || [];
      defaultHandlers.forEach((handler) => handler(msg));
    }
  }

  send(data) {
    if (this.destroyed) return;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close() {
    this.destroyed = true;

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    this.handlers.clear();
  }

  get readyState() {
    return this.ws?.readyState;
  }
}
