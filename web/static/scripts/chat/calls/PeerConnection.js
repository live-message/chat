const ICE = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: ["turn:turn.falbue.ru:3478", "turns:turn.falbue.ru:5349"],
    username: "lime",
    credential: "live-message",
  },
];


export class PeerConnection {
  constructor(remoteUid, onIce, onTrack) {
    this.remoteUid = remoteUid;
    this.pc = new RTCPeerConnection({ iceServers: ICE });

    this.pc.onicecandidate = (e) => {
      if (e.candidate) onIce(remoteUid, e.candidate);
    };

    this.pc.ontrack = (e) => onTrack(remoteUid, e.streams[0]);
  }

  addTrack(track, stream) {
    this.pc.addTrack(track, stream);
  }


  async createOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offer) {
    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  get glare() {
    return this.pc.signalingState === "have-local-offer";
  }

  async rollback() {
    await this.pc.setLocalDescription({ type: "rollback" });
  }

  createDataChannel(label, opts) {
    return this.pc.createDataChannel(label, opts);
  }

  onDataChannel(cb) {
    this.pc.ondatachannel = (e) => cb(e.channel);
  }

  async handleAnswer(answer) {
    await this.pc.setRemoteDescription(answer);
  }

  addIceCandidate(candidate) {
    this.pc.addIceCandidate(candidate);
  }

  hasVideo() {
    return this.pc.getSenders().some((s) => s.track?.kind === "video");
  }

  removeVideo() {
    this.pc.getSenders()
      .filter((s) => s.track?.kind === "video")
      .forEach((s) => this.pc.removeTrack(s));
  }

  close() {
    this.pc.close();
  }
}
