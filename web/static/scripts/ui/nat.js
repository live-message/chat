async function detectNatType(stunUrl = 'stun:stun.l.google.com:19302') {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: stunUrl }] });
    let type = 'turn';
    let foundSrflx = false;

    const timeout = setTimeout(() => {
      pc.close();
      resolve(foundSrflx ? 'stun' : type);
    }, 3000);

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;

      if (e.candidate.type === 'host') type = 'direct';
      if (e.candidate.type === 'srflx') foundSrflx = true;

      if (type === 'direct') {
        clearTimeout(timeout);
        pc.close();
        resolve('direct');
      }
    };

    pc.createDataChannel('nat-test');
    pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {
      clearTimeout(timeout);
      pc.close();
      resolve('error');
    });
  });
}

SPA(() => {
  detectNatType().then(nat => {
    const natElement = document.getElementById('nat-type');
    if (natElement) {
      natElement.textContent = nat.toUpperCase();
    }
  });
}, { id: 'nat-type' });
