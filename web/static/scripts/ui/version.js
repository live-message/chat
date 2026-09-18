async function getLatestTag(owner, repo) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags`);
  const data = await res.json();
  const stableTag = data.find(tag => !tag.name.toLowerCase().includes('beta'));
  return stableTag ? stableTag.name : null;
}

SPA(() => {
  getLatestTag('live-message', 'chat').then(tag => {
    const versionElement = document.getElementById('version');
    if (versionElement) {
      versionElement.textContent = tag;
    }
  });
}, { id: 'version' })
