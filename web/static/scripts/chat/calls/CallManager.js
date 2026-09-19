import { PeerConnection } from "./PeerConnection.js";
import { CallParticipants } from "./CallParticipants.js";

export class CallManager {
  constructor(ws, userData) {
    this.ws = ws;
    this.userData = userData;
    this.uid = userData.uid;
    this.peers = new Map();
    this.participants = new CallParticipants();
    this.localStream = null;
    this.inCall = false;
    this.muted = false;

    this.onSelfJoined = null;
    this.onSelfLeft = null;
    this.onPeerJoined = null;
    this.onPeerLeft = null;
    this.onRemoteStream = null;
    this.onMuteChange = null;

    this._bind();
  }

  async join() {
    if (this.inCall) return;
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.inCall = true;
    this.participants.add(this.userData);
    this.ws.send({ type: "call/join", ...this.userData });
    this.onSelfJoined?.();
    this.startedAt = Date.now();
  }

  leave() {
    if (!this.inCall) return;
    this.ws.send({ type: "call/leave", uid: this.uid });
    this._teardown();
    this.onSelfLeft?.();
  }

  toggleMute() {
    if (!this.inCall) return;
    this.muted = !this.muted;
    this.localStream.getAudioTracks().forEach((t) => (t.enabled = !this.muted));
    this.participants.setMuted(this.uid, this.muted);
    this.ws.send({ type: "call/mute", uid: this.uid, muted: this.muted });
    this.onMuteChange?.(this.uid, this.muted);
  }

  _bind() {
    this.ws.on("call/join", (m) => this._onJoin(m));
    this.ws.on("call/offer", (m) => this._onOffer(m));
    this.ws.on("call/answer", (m) => this._onAnswer(m));
    this.ws.on("call/ice", (m) => this._onIce(m));
    this.ws.on("call/leave", (m) => this._onLeave(m));
    this.ws.on("call/mute", (m) => this._onMute(m));
  }

  async _onJoin(m) {
    if (!this.inCall || m.uid === this.uid) return;
    this.participants.add(m);
    this.onPeerJoined?.(m.uid, m);
    const offer = await this._getPeer(m.uid).createOffer();
    this.ws.send({
      type: "call/offer",
      ...this.userData,
      targetUid: m.uid,
      sdp: offer,
      startedAt: this.startedAt,
    });
  }

  async _onOffer(m) {
    if (!this.inCall || m.targetUid !== this.uid) return;
    if (m.startedAt) this.startedAt = Math.min(this.startedAt, m.startedAt);
    const isNew = !this.peers.has(m.uid);
    const peer = this._getPeer(m.uid);
    if (isNew) this.onPeerJoined?.(m.uid, m);
    if (peer.glare) {
      if (this.uid > m.uid) return;
      await peer.rollback();
    }
    const answer = await peer.handleOffer(m.sdp);
    this.ws.send({ type: "call/answer", uid: this.uid, targetUid: m.uid, sdp: answer });
  }

  _onAnswer(m) {
    if (!this.inCall || m.targetUid !== this.uid) return;
    this.peers.get(m.uid)?.handleAnswer(m.sdp);
  }

  _onIce(m) {
    if (!this.inCall || m.targetUid !== this.uid) return;
    this.peers.get(m.uid)?.addIceCandidate(m.candidate);
  }

  _onLeave(m) {
    if (m.uid === this.uid) return;
    this.participants.remove(m.uid);
    this._removePeer(m.uid);
    this.onPeerLeft?.(m.uid);
  }

  _onMute(m) {
    if (m.uid === this.uid) return;
    this.participants.setMuted(m.uid, m.muted);
    this.onMuteChange?.(m.uid, m.muted);
  }

  _getPeer(uid) {
    if (!this.peers.has(uid)) {
      const peer = new PeerConnection(
        uid,
        (remoteUid, candidate) =>
          this.ws.send({ type: "call/ice", uid: this.uid, targetUid: remoteUid, candidate }),
        (remoteUid, stream) => {
          this.participants.setStream(remoteUid, stream);
          this.onRemoteStream?.(remoteUid, stream);
        }
      );
      this.localStream.getTracks().forEach((t) => peer.addTrack(t, this.localStream));
      this.peers.set(uid, peer);
    }
    return this.peers.get(uid);
  }

  _removePeer(uid) {
    this.peers.get(uid)?.close();
    this.peers.delete(uid);
  }

  _teardown() {
    this.peers.forEach((_, uid) => this._removePeer(uid));
    this.participants.clear();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.inCall = false;
    this.muted = false;
  }
}
