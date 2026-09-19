const originalSetItem = localStorage.setItem.bind(localStorage);

if (!localStorage.getItem('color')) {
  originalSetItem('color', '0');
}

localStorage.setItem = function (key, value) {
  originalSetItem(key, value);
  if (key === 'color') {
    showActiveLogo();
  }
};

function showActiveLogo() {
  const colorValue = localStorage.getItem('color');
  if (!colorValue || isNaN(parseInt(colorValue))) {
    document.querySelectorAll('#logos h1.accent').forEach(el => {
      el.hidden = true;
    });
    return;
  }

  const color = parseInt(colorValue);

  const ranges = {
    blueberry: { min: 121, max: 121 },
    grape: { min: 141, max: 141 },
    tomato: { min: 191, max: 191 },
    carrot: { min: 241, max: 241 },
    lemon: { min: 306, max: 306 },
    lime: { min: 0, max: 360 },
  };

  let activeName = '';
  for (const [name, range] of Object.entries(ranges)) {
    if (color >= range.min && color <= range.max) {
      activeName = name;
      break;
    }
  }

  document.querySelectorAll('#logos h1.accent').forEach(el => {
    el.hidden = (el.dataset.color !== activeName);
  });
}

window.addEventListener('storage', (e) => {
  if (e.key === 'color') {
    showActiveLogo();
  }
});

showActiveLogo();

SPA(showActiveLogo, {
  id: 'logos',
  continuous: true
});
