import { ChatWebSocket } from "../websocket.js";

let currentChat = null;

function initChat() {
  const match = window.location.pathname.match(/\/bot\/([^/?]+)/);
  const botName = match ? match[1] : null;

  function getCurrentUserData() {
    return {
      kaomoji: localStorage.getItem("kaomoji"),
      uid: localStorage.getItem("uid"),
      username: localStorage.getItem("username"),
    };
  }

  const userData = getCurrentUserData();
  const ws = new ChatWebSocket(botName, userData, "bot");

  ws.on("welcome", (data) => {
    console.log(data);

  });


  ws.connect();

}


SPA(
  () => {
    currentChat = initChat();
  },
  {
    id: "messageBot",
    continuous: true,
  },
);
