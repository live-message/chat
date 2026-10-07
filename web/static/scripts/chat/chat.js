import { ChatWebSocket } from "./websocket.js";
import { ChatUI } from "./ui.js";
import { UsersManager } from "./users.js";
import { CallUI } from "./calls/CallUI.js";

let currentChat = null;

function cleanupChat() {
  if (currentChat) {
    currentChat.callUI?.destroy();
    currentChat.close();
    currentChat.ui.clearTextarea?.();
    currentChat = null;
  }
}

function initChat() {
  const match = window.location.pathname.match(/\/chat\/([^/?]+)/);
  const roomId = match ? match[1] : null;

  if (!roomId) return null;

  function getCurrentUserData() {
    return {
      kaomoji: localStorage.getItem("kaomoji"),
      uid: localStorage.getItem("uid"),
      username: localStorage.getItem("username"),
      uid: localStorage.getItem("uid"),
    };
  }

  const userData = getCurrentUserData();

  const ws = new ChatWebSocket(roomId, userData, "users");
  const usersManager = new UsersManager();
  const ui = new ChatUI(usersManager);
  ui.displayDiv();

  ws.on("welcome", (msg) => {
    const user = msg.user
    usersManager.add(user);
    ui.displayDiv();
    notification(`${user.username} с нами`)
    ws.send({ user: { ...getCurrentUserData() }, type: "welcome_to" })
  })

    .on("welcome_to", (msg) => {
      const user = msg.user
      usersManager.add(user);
      ui.displayDiv();
    })

    .on("exit", (msg) => {
      const oldUsers = usersManager.getList();
      usersManager.clear()
      ws.send({ user: { ...getCurrentUserData() }, type: "welcome" });
      const newUsers = usersManager.getList();

      const removedUsers = Object.keys(oldUsers)
        .filter(uid => !(uid in newUsers))
        .map(uid => ({ ...oldUsers[uid], uid }));

      ui.displayDiv();
      callUI._removeCard(removedUsers[0].uid);
      notification(`${removedUsers[0].username} отключился`);
    })

    .on("message", (msg) => {
      const user = msg.user
      ui.updateMessage(user, msg);
    });

  ui.onInput(() => {
    const text = ui.textarea?.value || "";
    ws.send({ user: { ...getCurrentUserData() }, type: "message", text });
  });

  ui.onReset(() => {
    ui.clearTextarea();
    ws.send({ user: { ...getCurrentUserData() }, type: "message", text: "" });
  });

  ws.connect();
  const callUI = new CallUI(ws, userData);



  return {
    close: () => ws.close(),
    ws,
    ui,
    usersManager,
    callUI,
  };
}

SPA(
  () => {
    cleanupChat();
    currentChat = initChat();
  },
  {
    id: "message",
    continuous: true,
  },
);
