import { ChatWebSocket } from "../websocket.js";
import { renderBot } from "./ui.js";

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
    console.log("welcome data:", data);

    renderBot(data.bot, (callbackData, buttonData) => {
      ws.send({ user: { ...getCurrentUserData() }, type: "button", callback: callbackData });
    });
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
