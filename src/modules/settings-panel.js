// ── Ayarlar Paneli ────────────────────────────────────────────────────────────
// macOS Terminal Settings muadili

const { THEMES, effectiveAlpha } = require('./theme-engine');

const DEFAULT_SETTINGS = {
  profile: 'natureco',
  fontSize: 13,
  cursorStyle: 'block',
  cursorBlink: false,
  shell: 'auto',
  opacity: null,
  glass: 'acrylic',
  gpuRenderer: false,
  lang: null,
};

function createSettingsPanel({ settings, applySettings, t, termAPI }) {
  const overlayEl = document.getElementById('settings-overlay');
  const profileGridEl = document.getElementById('profile-grid');
  const fontValueEl = document.getElementById('font-size-value');
  const opacitySliderEl = document.getElementById('opacity-slider');
  const opacityValueEl = document.getElementById('opacity-value');
  const cursorStyleEl = document.getElementById('cursor-style');
  const cursorBlinkEl = document.getElementById('cursor-blink');
  const shellSelectEl = document.getElementById('set-shell');

  function toggleSettings() {
    overlayEl.hidden ? openSettings() : closeSettings();
  }

  function openSettings() {
    syncSettingsUI();
    overlayEl.hidden = false;
  }

  function closeSettings() {
    overlayEl.hidden = true;
  }

  function syncSettingsUI() {
    for (const card of profileGridEl.querySelectorAll('.profile-card')) {
      card.classList.toggle('selected', card.dataset.key === settings.profile);
    }
    const pct = Math.round(effectiveAlpha(settings) * 100);
    opacitySliderEl.value = pct;
    opacityValueEl.textContent = `${pct}%`;
    fontValueEl.textContent = settings.fontSize;
    for (const btn of cursorStyleEl.querySelectorAll('button')) {
      btn.classList.toggle('selected', btn.dataset.style === settings.cursorStyle);
    }
    cursorBlinkEl.checked = settings.cursorBlink;
    shellSelectEl.value = settings.shell;
    for (const btn of document.querySelectorAll('#glass-mode button')) {
      btn.classList.toggle('selected', btn.dataset.glass === (settings.glass || 'acrylic'));
    }
    for (const btn of document.querySelectorAll('#lang-mode button')) {
      btn.classList.toggle('selected', btn.dataset.lang === (settings.lang || 'en'));
    }
  }

  function buildSettingsUI() {
    // Profil kartları
    for (const [key, th] of Object.entries(THEMES)) {
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.dataset.key = key;

      const preview = document.createElement('div');
      preview.className = 'profile-preview';
      preview.style.background = `rgba(${th.bgRgb}, ${th.bgAlpha})`;
      preview.style.color = th.theme.foreground;
      const dots = [th.theme.red, th.theme.green, th.theme.yellow, th.theme.blue]
        .map((c) => `<span style="color:${c}">&#9679;</span>`).join(' ');
      preview.innerHTML = `<div>user$ ls</div><div>${dots}</div>`;

      const nameEl = document.createElement('div');
      nameEl.className = 'profile-name';
      nameEl.textContent = th.name;

      card.appendChild(preview);
      card.appendChild(nameEl);
      card.addEventListener('click', () => {
        settings.profile = key;
        applySettings();
        syncSettingsUI();
      });
      profileGridEl.appendChild(card);
    }

    // Opaklık
    opacitySliderEl.addEventListener('input', () => {
      settings.opacity = parseInt(opacitySliderEl.value, 10) / 100;
      opacityValueEl.textContent = `${opacitySliderEl.value}%`;
      applySettings();
    });
    document.getElementById('opacity-reset').addEventListener('click', () => {
      settings.opacity = null;
      applySettings();
      syncSettingsUI();
    });

    // Cam efekti
    termAPI.getCaps().then((caps) => {
      if (caps && caps.acrylic === false) {
        const btn = document.querySelector('#glass-mode button[data-glass="acrylic"]');
        if (btn) {
          btn.classList.add('disabled');
          btn.title = t('acrylicReq');
        }
      }
    }).catch(() => {});
    for (const btn of document.querySelectorAll('#glass-mode button')) {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('disabled')) return;
        const v = btn.dataset.glass;
        if ((settings.glass || 'acrylic') === v) return;
        settings.glass = v;
        applySettings();
        termAPI.relaunch();
      });
    }

    // Yazı boyutu
    document.getElementById('font-minus').addEventListener('click', () => {
      settings.fontSize = Math.max(9, settings.fontSize - 1);
      applySettings();
      syncSettingsUI();
    });
    document.getElementById('font-plus').addEventListener('click', () => {
      settings.fontSize = Math.min(24, settings.fontSize + 1);
      applySettings();
      syncSettingsUI();
    });

    // İmleç stili
    for (const btn of cursorStyleEl.querySelectorAll('button')) {
      btn.addEventListener('click', () => {
        settings.cursorStyle = btn.dataset.style;
        applySettings();
        syncSettingsUI();
      });
    }

    // İmleç yanıp sönme
    cursorBlinkEl.addEventListener('change', () => {
      settings.cursorBlink = cursorBlinkEl.checked;
      applySettings();
    });

    // Kabuk seçenekleri
    termAPI.listShells().then((profiles) => {
      for (const [key, p] of Object.entries(profiles)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = p.name;
        shellSelectEl.appendChild(opt);
      }
      shellSelectEl.value = settings.shell;
    });
    shellSelectEl.addEventListener('change', () => {
      settings.shell = shellSelectEl.value;
      applySettings();
    });

    // Dil seçimi
    for (const btn of document.querySelectorAll('#lang-mode button')) {
      btn.addEventListener('click', () => {
        if (settings.lang === btn.dataset.lang) return;
        settings.lang = btn.dataset.lang;
        applySettings();
      });
    }

    document.getElementById('settings-close').addEventListener('click', closeSettings);
    overlayEl.addEventListener('mousedown', (e) => {
      if (e.target === overlayEl) closeSettings();
    });
  }

  return { toggleSettings, openSettings, closeSettings, buildSettingsUI, syncSettingsUI };
}

module.exports = { DEFAULT_SETTINGS, createSettingsPanel };
