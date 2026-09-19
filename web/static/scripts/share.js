function handleShareClick(event) {
  const showNotification = (msg) => {
    if (typeof notification === 'function') {
      notification(msg);
    } else {
      alert(msg);
    }
  };

  if (navigator.share) {
    navigator
      .share({
        title: "live message",
        text: "Приглашение в чат\n",
        url: window.location.href,
      })
      .then(() => {
        showNotification("Ссылка скопирована в буфер обмена!");
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          showNotification("Ошибка при попытке поделиться");
          console.error(error);
        }
      });
  }
}

SPA(() => {
  const btn = document.getElementById("share");
  if (btn && !btn.dataset.shareHandlerAttached) {
    btn.addEventListener("click", handleShareClick);
    btn.dataset.shareHandlerAttached = "true";
  }
}, {
  id: "share"
});
