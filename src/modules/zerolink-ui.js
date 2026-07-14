// ── ZeroLink UI ──────────────────────────────────────────────────────────────
// P2P şifreli uzak terminal paneli

function createZeroLinkUI({ settings, tabs, activeTabId, termAPI, t }) {
  const zlOverlayEl = document.getElementById('zl-overlay');
  const zlState = {
    hostActive: false,
    hostConnected: false,
    clientActive: false,
    clientTabId: null,
    lastCode: null,
    lastAddr: null,
  };
  const zlForwards = new Set();

  function toggleZeroLink() { zlOverlayEl.hidden ? openZeroLink() : closeZeroLink(); }
  function openZeroLink() { zlResetToModeSelect(); zlOverlayEl.hidden = false; }
  function closeZeroLink() { zlOverlayEl.hidden = true; }

  function zlResetToModeSelect() {
    document.getElementById('zl-mode-select').hidden = false;
    document.getElementById('zl-host-view').hidden = true;
    document.getElementById('zl-client-view').hidden = true;
    document.getElementById('zl-back-btn').hidden = true;
    document.getElementById('zl-error').hidden = true;
    zlShowHostIdle();
    zlShowClientIdle();
  }

  function zlShowError(msg) {
    const el = document.getElementById('zl-error');
    el.textContent = '⚠ ' + msg;
    el.hidden = false;
  }
  function zlClearError() { document.getElementById('zl-error').hidden = true; }

  // HOST UI
  function zlShowHostIdle() {
    document.getElementById('zl-host-idle').hidden = false;
    document.getElementById('zl-host-active').hidden = true;
    document.getElementById('zl-host-connected').hidden = true;
  }
  function zlShowHostActive(code) {
    document.getElementById('zl-host-idle').hidden = true;
    document.getElementById('zl-host-active').hidden = false;
    document.getElementById('zl-host-connected').hidden = true;
    document.getElementById('zl-code-display').textContent = code;
    document.getElementById('zl-timer').classList.remove('zl-timer-urgent');
    zlClearError();
  }
  function zlShowHostConnected(addr) {
    document.getElementById('zl-host-idle').hidden = true;
    document.getElementById('zl-host-active').hidden = true;
    document.getElementById('zl-host-connected').hidden = false;
    document.getElementById('zl-connected-addr').textContent = `${t('zlConnectedAddr')} ${addr || ''}`.trim();
  }

  // CLIENT UI
  function zlShowClientIdle() {
    document.getElementById('zl-client-idle').hidden = false;
    document.getElementById('zl-client-connecting').hidden = true;
    document.getElementById('zl-client-connected').hidden = true;
  }
  function zlShowClientConnecting() {
    document.getElementById('zl-client-idle').hidden = true;
    document.getElementById('zl-client-connecting').hidden = false;
    document.getElementById('zl-client-connected').hidden = true;
  }
  function zlShowClientConnected() {
    document.getElementById('zl-client-idle').hidden = true;
    document.getElementById('zl-client-connecting').hidden = true;
    document.getElementById('zl-client-connected').hidden = false;
  }

  function _zlHostStopReset() {
    termAPI.zlHostStop();
    zlState.hostActive = false;
    zlState.hostConnected = false;
    zlShowHostIdle();
    document.getElementById('zl-host-start-btn').disabled = false;
  }

  function _zlClientReset() {
    const tabId = zlState.clientTabId;
    zlState.clientActive = false;
    zlState.clientTabId = null;
    _zlClearTools();
    zlShowClientIdle();
  }

  function _zlClearTools() { zlForwards.clear(); zlRenderForwards(); _zlFileStatus(''); }

  function _zlFileStatus(txt) {
    const el = document.getElementById('zl-file-status');
    if (el) el.textContent = txt;
  }

  function _fmtBytes(n) {
    if (n == null) return '';
    if (n < 1024) return n + 'B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + 'KB';
    return (n / 1024 / 1024).toFixed(1) + 'MB';
  }

  function zlRenderForwards() {
    const list = document.getElementById('zl-fwd-list');
    if (!list) return;
    list.innerHTML = '';
    for (const f of zlForwards) {
      const item = document.createElement('div');
      item.className = 'zl-fwd-item';
      const label = document.createElement('span');
      label.textContent = `:${f.localPort} → ${f.target}`;
      const kill = document.createElement('button');
      kill.className = 'zl-fwd-kill';
      kill.textContent = '×';
      kill.title = t('zlRemove');
      kill.addEventListener('click', () => {
        termAPI.zlClientForwardRemove(f.localPort);
        zlForwards.delete(f);
        zlRenderForwards();
      });
      item.append(label, kill);
      list.appendChild(item);
    }
  }

  function _updateZlTitlebarBtn() {
    const btn = document.getElementById('btn-zerolink');
    const active = zlState.hostActive || zlState.hostConnected || zlState.clientActive;
    btn.classList.toggle('zl-active', active);
    btn.title = active ? t('zlBtnTitleActive') : t('zlBtnTitle');
  }

  // Event listeners
  document.getElementById('btn-zerolink').addEventListener('click', toggleZeroLink);
  document.getElementById('zl-close').addEventListener('click', closeZeroLink);
  zlOverlayEl.addEventListener('mousedown', (e) => { if (e.target === zlOverlayEl) closeZeroLink(); });

  document.getElementById('zl-btn-host').addEventListener('click', () => {
    document.getElementById('zl-mode-select').hidden = true;
    document.getElementById('zl-host-view').hidden = false;
    document.getElementById('zl-back-btn').hidden = false;
  });

  document.getElementById('zl-host-start-btn').addEventListener('click', async () => {
    zlClearError();
    const startBtn = document.getElementById('zl-host-start-btn');
    startBtn.disabled = true;
    document.getElementById('zl-host-status').textContent = t('zlPreparing');
    try {
      const { code } = await termAPI.zlHostStart(activeTabId);
      zlState.hostActive = true;
      zlState.lastCode = code;
      zlShowHostActive(code);
      _updateZlTitlebarBtn();
    } catch (err) {
      zlShowError(err.message);
      startBtn.disabled = false;
    }
  });

  document.getElementById('zl-code-copy').addEventListener('click', () => {
    const code = document.getElementById('zl-code-display').textContent;
    termAPI.clipboardWrite(code);
    const btn = document.getElementById('zl-code-copy');
    btn.textContent = t('zlCopied');
    btn.title = t('zlCopied');
    setTimeout(() => { btn.textContent = t('zlCopy'); btn.title = t('zlCopy'); }, 2000);
  });

  document.getElementById('zl-host-stop-btn').addEventListener('click', _zlHostStopReset);
  document.getElementById('zl-host-disconnect-btn').addEventListener('click', _zlHostStopReset);

  // HOST events
  termAPI.onZlHostCode(({ code }) => {
    zlState.lastCode = code;
    zlShowHostActive(code);
  });

  termAPI.onZlHostTimer(({ secondsLeft }) => {
    const m = Math.floor(secondsLeft / 60);
    const s = String(secondsLeft % 60).padStart(2, '0');
    const timerEl = document.getElementById('zl-timer');
    if (timerEl) {
      timerEl.textContent = `${m}:${s}`;
      if (secondsLeft <= 10) timerEl.classList.add('zl-timer-urgent');
    }
  });

  termAPI.onZlHostExpired(() => {
    zlState.hostActive = false;
    zlState.hostConnected = false;
    zlState.lastCode = null;
    zlShowHostIdle();
    zlShowError(t('zlCodeExpired'));
    document.getElementById('zl-host-start-btn').disabled = false;
    _updateZlTitlebarBtn();
  });

  termAPI.onZlHostConnected(({ addr }) => {
    zlState.hostConnected = true;
    zlState.lastAddr = addr;
    zlShowHostConnected(addr);
    _updateZlTitlebarBtn();
  });

  termAPI.onZlHostDisconnected(() => {
    zlState.hostActive = false;
    zlState.hostConnected = false;
    zlState.lastAddr = null;
    zlShowHostIdle();
    document.getElementById('zl-host-start-btn').disabled = false;
    _updateZlTitlebarBtn();
  });

  // CLIENT events
  document.getElementById('zl-btn-client').addEventListener('click', () => {
    document.getElementById('zl-mode-select').hidden = true;
    document.getElementById('zl-client-view').hidden = false;
    document.getElementById('zl-back-btn').hidden = false;
    setTimeout(() => document.getElementById('zl-code-input').focus(), 50);
  });

  document.getElementById('zl-client-connect-btn').addEventListener('click', async () => {
    const code = document.getElementById('zl-code-input').value.trim();
    if (!code) { zlShowError(t('zlCodeEmpty')); return; }
    zlClearError();
    zlShowClientConnecting();
    zlState.clientTabId = activeTabId;
    try {
      await termAPI.zlClientConnect(code, activeTabId);
    } catch (err) {
      zlShowClientIdle();
      zlShowError(err.message);
    }
  });

  document.getElementById('zl-code-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('zl-client-connect-btn').click();
  });

  document.getElementById('zl-client-disconnect-btn').addEventListener('click', () => {
    termAPI.zlClientDisconnect();
    document.getElementById('zl-code-input').value = '';
    _zlClientReset();
  });

  termAPI.onZlClientConnected(() => {
    zlState.clientActive = true;
    zlShowClientConnected();
    _updateZlTitlebarBtn();
    setTimeout(() => closeZeroLink(), 900);
  });

  termAPI.onZlClientRemoteExit(({ code }) => {
    const t = tabs.get(zlState.clientTabId);
    if (t) t.term.write(`\r\n\x1b[90m[uzak oturum kapandı — çıkış kodu ${code}]\x1b[0m\r\n`);
    termAPI.zlClientDisconnect();
    _zlClientReset();
  });

  termAPI.onZlClientDisconnected(() => {
    const wasActive = zlState.clientActive;
    _zlClientReset();
    if (wasActive) zlShowError(t('zlDisconnectedMsg'));
  });

  // File transfer & port forwarding
  document.getElementById('zl-push-btn').addEventListener('click', async () => {
    try {
      const res = await termAPI.zlClientPushFile();
      if (res && !res.canceled) _zlFileStatus(`⬆ ${res.name} …`);
    } catch (err) { _zlFileStatus('⚠ ' + err.message); }
  });

  async function zlDoPull() {
    const input = document.getElementById('zl-pull-input');
    const remotePath = input.value.trim();
    if (!remotePath) return;
    try {
      const res = await termAPI.zlClientPullFile(remotePath);
      _zlFileStatus(`⬇ ${res.name} …`);
      input.value = '';
    } catch (err) { _zlFileStatus('⚠ ' + err.message); }
  }
  document.getElementById('zl-pull-btn').addEventListener('click', zlDoPull);
  document.getElementById('zl-pull-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') zlDoPull(); });

  document.getElementById('zl-fwd-add-btn').addEventListener('click', async () => {
    const lp = document.getElementById('zl-fwd-local').value.trim();
    const rh = document.getElementById('zl-fwd-host').value.trim() || '127.0.0.1';
    const rp = document.getElementById('zl-fwd-port').value.trim();
    if (!lp || !rp) return;
    try {
      await termAPI.zlClientForwardAdd(lp, rh, rp);
      document.getElementById('zl-fwd-local').value = '';
      document.getElementById('zl-fwd-port').value = '';
    } catch (err) { _zlFileStatus('⚠ ' + err.message); }
  });

  termAPI.onZlClientFileProgress(({ name, sent, size }) => {
    const pct = size ? Math.round(sent / size * 100) : 0;
    _zlFileStatus(`${name} ${pct}%`);
  });
  termAPI.onZlClientFileDone((info) => {
    _zlFileStatus(info.name ? `✓ ${info.name} (${_fmtBytes(info.bytes)})` : '✓ tamam');
  });
  termAPI.onZlClientFileError(({ message }) => _zlFileStatus('⚠ ' + message));
  termAPI.onZlClientForwardOpen(({ localPort, target }) => { zlForwards.add({ localPort, target }); zlRenderForwards(); });
  termAPI.onZlClientForwardError(({ localPort, message }) => _zlFileStatus(`⚠ port ${localPort}: ${message}`));

  // Ortak hata
  termAPI.onZlError(({ message }) => {
    zlState.hostActive = false;
    zlState.hostConnected = false;
    if (zlState.clientTabId != null) _zlClientReset();
    zlState.clientActive = false;
    zlShowError(message);
    zlShowHostIdle();
    zlShowClientIdle();
    document.getElementById('zl-host-start-btn').disabled = false;
    _updateZlTitlebarBtn();
  });

  // Back button
  document.getElementById('zl-back-btn').addEventListener('click', () => {
    termAPI.zlHostStop();
    termAPI.zlClientDisconnect();
    zlResetToModeSelect();
  });

  return {
    toggleZeroLink,
    openZeroLink,
    closeZeroLink,
    zlState,
  };
}

module.exports = { createZeroLinkUI };
