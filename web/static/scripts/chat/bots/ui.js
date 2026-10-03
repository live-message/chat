export function renderBot(data = {}, onButtonClick = null) {
  const botSection = document.getElementById("bot");

  if (!botSection) {
    console.error("Не найдена секция #bot");
    return;
  }

  const botNameBox = document.querySelector("#botName");
  const messageBox = botSection.querySelector("#messageBot");
  const buttonsBox = botSection.querySelector("#buttons");

  if (!messageBox || !buttonsBox) {
    console.error("Не найдены #messageBot или #buttons");
    return;
  }

  if (botNameBox && data.welcome?.name) {
    botNameBox.textContent = data.welcome.name;
  }

  let messageText = messageBox.querySelector("p");

  if (!messageText) {
    messageText = document.createElement("p");
    messageBox.appendChild(messageText);
  }

  messageText.textContent = data.text ?? "";

  buttonsBox.replaceChildren();

  const rows = data.buttons ?? data.welcome?.buttons ?? [];

  if (!Array.isArray(rows)) {
    console.warn("buttons должен быть массивом", rows);
    return;
  }

  rows.forEach((row) => {
    if (!Array.isArray(row) || row.length === 0) {
      return;
    }

    const nav = document.createElement("nav");

    row.forEach((buttonData) => {
      if (!buttonData || buttonData.text == null) {
        return;
      }

      const button = document.createElement("button");

      button.type = "button";
      button.textContent = String(buttonData.text);
      button.dataset.callback = buttonData.callback_data ?? "";

      if (typeof onButtonClick === "function") {
        button.addEventListener("click", () => {
          onButtonClick(buttonData.callback_data, buttonData);
        });
      }

      nav.appendChild(button);
    });

    buttonsBox.appendChild(nav);
  });
}
