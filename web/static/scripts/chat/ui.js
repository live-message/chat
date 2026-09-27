export class ChatUI {
  constructor(usersManager) {
    this.section = document.getElementById('message');
    this.message = this.section?.querySelector('p');
    this.textarea = document.querySelector('textarea');
    this.resetBtn = document.getElementById('reset');
    this.emptyState = document.getElementById('users-none');
    this.userListEl = document.getElementById('users-list');
    this.chatTitle = document.getElementById('chat-title');
    this.users = usersManager;
  }

  updateChatTitle(title) {
    if (this.chatTitle) this.chatTitle.textContent = title;
  }

  displayDiv(hidden = false) {
    if (hidden) {
      this.emptyState.hidden = true;
      this.userListEl.hidden = true;
      return;
    }

    const usersObj = this.users.getList();
    const userKeys = Object.keys(usersObj);

    if (userKeys.length > 0) {
      this.renderUsers(userKeys);
      this.userListEl.hidden = false;
      this.emptyState.hidden = true;
    } else {
      this.userListEl.hidden = true;
      this.emptyState.hidden = false;
    }
    if (userKeys.length >= 2) {
      this.updateChatTitle("Группа");
    }
    if (userKeys.length === 1) {
      this.updateChatTitle(usersObj[userKeys[0]].kaomoji);
    }
  }

  updateMessage(text = '', msg) {
    const hasText = text.trim().length > 0;
    if (msg.text === "") {
      this.message.textContent = '';
      this.displayDiv(false);
    } else {
      this.message.textContent = text;
      this.displayDiv(true);
    }
  }

  renderUsers(keys) {
    if (!this.userListEl) return;

    const usersObj = this.users.getList();

    this.userListEl.innerHTML = keys.map(uid => {
      const u = usersObj[uid];
      return `<h4><span>${u.kaomoji ?? ''}</span> <span>${u.username ?? ''}</span></h4>`;
    }).join('');
  }

  onInput(cb) { this.textarea?.addEventListener('input', cb); }
  onReset(cb) { this.resetBtn?.addEventListener('click', cb); }
  onInvite(cb) { this.emptyState?.querySelector('button')?.addEventListener('click', cb); }
  clearTextarea() { if (this.textarea) this.textarea.value = ''; }
}
