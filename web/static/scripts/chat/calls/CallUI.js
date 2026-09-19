import { CallManager } from "./CallManager.js";

export class CallUI {
  constructor(ws, userData) {
    this.userData = userData;
    this.manager = new CallManager(ws, userData);

    this.panel = document.getElementById("call-panel");
    this.peersBox = document.getElementById("call-peers");
    this.timeEl = document.getElementById("call-time");
    this.muteBtn = document.getElementById("call-mute");
    this.microHeader = document.getElementById("call-mute-header");
    this.enlargeBtn = document.getElementById("call-enlarge");

    this.btn = document.getElementById("login-call");
    if (this.btn) this.btn.onclick = () => (this.manager.inCall ? this.manager.leave() : this.manager.join());

    this.muteBtn.onclick = () => this.manager.toggleMute();
    document.getElementById("call-leave").onclick = () => this.manager.leave();
    this.enlargeBtn.onclick = () => this._toggleEnlarge();
    this.timeEl.onclick = () => this._toggleEnlarge();

    this._wire();
  }

  _wire() {
    const m = this.manager;
    m.onSelfJoined = () => this._show();
    m.onSelfLeft = () => this._hide();
    m.onPeerJoined = (uid, user) => this._addCard(uid, user);
    m.onPeerLeft = (uid) => this._removeCard(uid);
    m.onRemoteStream = (uid, s) => this._addAudio(uid, s);
    m.onMuteChange = (uid, mut) => this._setMute(uid, mut);
  }

  _show() {
    this.peersBox.innerHTML = "";
    this._addCard(this.userData.uid, this.userData, true);
    this.panel.hidden = false;
    this.btn.classList.replace('iconoir-phone', 'iconoir-phone-disabled');
    this.btn.classList.add('active');
    this._startTimer();
  }

  _hide() {
    this._stopTimer();
    this.panel.querySelectorAll("audio").forEach((a) => {
      a.srcObject?.getTracks().forEach((t) => t.stop());
      a.remove();
    });
    this.peersBox.innerHTML = "";
    this.panel.hidden = true;
    this.btn.classList.replace('iconoir-phone-disabled', 'iconoir-phone');
    this.btn.classList.remove('active');
  }

  _addCard(uid, user, self = false) {
    const p = this.manager.participants.get(uid) || {};

    this.peersBox.insertAdjacentHTML(
      "beforeend",
      `
        <div class="call-card" data-uid="${uid}">
          <p class="call-card__name"></p>
          <nav>
            ${self ? "" : `
              <button class="local-mute iconoir-sound-high" type="button" title="Убрать звук"></button>
              <input class="volume" type="range" min="0" max="1" step="0.01" value="${p.volume ?? 1}" title="Громкость">
            `}
          </nav>
        </div>
      `
    );

    const card = this.peersBox.querySelector(`.call-card[data-uid="${uid}"]`);
    card.querySelector(".call-card__name").textContent = user.kaomoji || user.username || uid;

    const input = card.querySelector(".volume");
    const btn = card.querySelector(".local-mute");

    if (input) input.oninput = () => this.setVolume(uid, Number(input.value));

    if (btn && input) {
      btn.dataset.prev = p.volume || 1;
      btn.onclick = () => {
        if (Number(input.value) === 0) this.setVolume(uid, Number(btn.dataset.prev || 1));
        else this.setVolume(uid, 0);
      };
    }

    this._updateLocalMuteUI(uid);
  }

  _removeCard(uid) {
    this.peersBox.querySelector(`[data-uid="${uid}"]`)?.remove();
    const a = this.panel.querySelector(`audio[data-uid="${uid}"]`);
    if (a) {
      a.srcObject?.getTracks().forEach((t) => t.stop());
      a.remove();
    }
  }

  _addAudio(uid, stream) {
    const a = new Audio();
    a.srcObject = stream;
    a.dataset.uid = uid;
    a.autoplay = true;

    const input = this.peersBox.querySelector(`.call-card[data-uid="${uid}"] .volume`);
    a.volume = input ? Number(input.value) : 1;

    this.panel.append(a);
    this._updateLocalMuteUI(uid);
  }

  _setMute(uid, muted) {
    const card = this.peersBox.querySelector(`.call-card[data-uid="${uid}"]`);
    if (card) card.classList.toggle("muted", muted);

    if (uid === this.userData.uid) {
      this.muteBtn.classList.remove("iconoir-microphone-mute-solid", "iconoir-microphone");
      this.microHeader.classList.remove("iconoir-microphone-mute-solid", "iconoir-microphone");

      const iconClass = muted ? "iconoir-microphone-mute-solid" : "iconoir-microphone";
      this.muteBtn.classList.add(iconClass);
      this.microHeader.classList.add(iconClass);
    }
  }

  setVolume(uid, v) {
    v = Math.max(0, Math.min(1, Number(v) || 0));

    const p = this.manager.participants.get(uid);
    if (p) p.volume = v;

    const audio = this.panel.querySelector(`audio[data-uid="${uid}"]`);
    if (audio) audio.volume = v;

    const card = this.peersBox.querySelector(`.call-card[data-uid="${uid}"]`);
    if (!card) return;

    const input = card.querySelector(".volume");
    const btn = card.querySelector(".local-mute");

    if (input) input.value = v;
    if (btn && v > 0) btn.dataset.prev = v;

    this._updateLocalMuteUI(uid);
  }

  _updateLocalMuteUI(uid) {
    const card = this.peersBox.querySelector(`.call-card[data-uid="${uid}"]`);
    if (!card) return;

    const btn = card.querySelector(".local-mute");
    const input = card.querySelector(".volume");
    if (!btn || !input) return;

    const muted = Number(input.value) === 0;

    btn.classList.toggle("iconoir-sound-off", muted);
    btn.classList.toggle("iconoir-sound-high", !muted);
    btn.title = muted ? "Включить звук" : "Убрать звук";
  }

  _startTimer() {
    this._t0 = Date.now();
    this._timer = setInterval(() => {
      const s = Math.floor((Date.now() - this.manager.startedAt) / 1000);
      this.timeEl.textContent = `${String((s / 60) | 0).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }, 1000);
  }

  _stopTimer() {
    clearInterval(this._timer);
    this.timeEl.textContent = "00:00";
  }

  _toggleEnlarge() {
    const min = this.panel.classList.toggle("minimized");
    this.enlargeBtn.firstElementChild.className = min ? "iconoir-enlarge" : "iconoir-reduce";
  }

  destroy() {
    this.manager.leave();
    if (this.btn) this.btn.onclick = null;
  }
}
