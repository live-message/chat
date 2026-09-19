export class CallParticipants {
  constructor() {
    this.list = new Map(); // { uid, username, kaomoji, muted, volume, stream }
  }
  add(user) { this.list.set(user.uid, { muted: false, volume: 1, stream: null, ...user, }); }
  get(uid) { return this.list.get(uid); }
  remove(uid) { this.list.delete(uid); }
  clear() { this.list.clear(); }
  setMuted(uid, muted) { const u = this.list.get(uid); if (u) u.muted = muted; }
  setVolume(uid, volume) { const u = this.list.get(uid); if (u) u.volume = volume; }
  setStream(uid, stream) { const u = this.list.get(uid); if (u) u.stream = stream; }
}
