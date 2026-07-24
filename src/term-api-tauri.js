import { Channel, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';

const appWindow = getCurrentWindow();
const noop = () => {};
const noopSubscription = () => noop;
const unsupported = (feature) => Promise.reject(new Error(`${feature} arrives in a later Tauri build`));
const closeRequested = new Set();
const ptyData = new Map();
const ptyExit = new Map();
const ptyWrites = new Map();

function subscribe(map, key, callback) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(callback);
  return () => {
    map.get(key)?.delete(callback);
    if (!map.get(key)?.size) map.delete(key);
  };
}

function emit(map, key, value) {
  for (const callback of map.get(key) || []) callback(value);
}

function tauriWindowSubscription(register, callback) {
  let disposed = false;
  let unlisten = null;
  register((event) => callback(event.payload)).then((fn) => {
    if (disposed) fn();
    else unlisten = fn;
  }).catch((error) => console.warn('Tauri window event subscription failed:', error));
  return () => {
    disposed = true;
    unlisten?.();
  };
}

function tauriEventSubscription(eventName, callback) {
  let disposed = false;
  let unlisten = null;
  listen(eventName, (event) => callback(event.payload)).then((fn) => {
    if (disposed) fn();
    else unlisten = fn;
  }).catch((error) => console.warn(`Tauri event subscription failed (${eventName}):`, error));
  return () => {
    disposed = true;
    unlisten?.();
  };
}

async function createPty(tabId, profileKey, cols, rows, cwd) {
  const onData = new Channel();
  const onExit = new Channel();
  onData.onmessage = (data) => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    try {
      emit(ptyData, tabId, bytes);
    } finally {
      invoke('pty_ack', { tabId }).catch((error) => console.warn('PTY acknowledgement failed:', error));
    }
  };
  onExit.onmessage = (code) => emit(ptyExit, tabId, code);
  return invoke('create_pty', { tabId, profileKey, cols, rows, cwd, onData, onExit });
}

function invokePty(command, payload) {
  return invoke(command, payload).catch((error) => console.warn(`${command} failed:`, error));
}

function writePty(tabId, data) {
  const write = (ptyWrites.get(tabId) || Promise.resolve())
    .catch(noop)
    .then(() => invoke('pty_write', { tabId, data }));
  ptyWrites.set(tabId, write);
  write.finally(() => {
    if (ptyWrites.get(tabId) === write) ptyWrites.delete(tabId);
  }).catch(noop);
  return write.catch((error) => console.warn('pty_write failed:', error));
}

function killPty(tabId) {
  const pending = ptyWrites.get(tabId) || Promise.resolve();
  ptyWrites.delete(tabId);
  return pending.catch(noop).then(() => invokePty('pty_kill', { tabId }));
}

window.termAPI = Object.freeze({
  minimize: () => appWindow.minimize(),
  maximize: () => appWindow.toggleMaximize(),
  close: () => {
    if (closeRequested.size) {
      for (const callback of closeRequested) callback();
      return Promise.resolve();
    }
    return appWindow.destroy();
  },
  confirmClose: () => appWindow.destroy(),

  listShells: () => invoke('list_shells'),
  getSettings: () => invoke('get_settings'),
  setSettings: (settings) => invoke('set_settings', { settings }),
  relaunch: () => invoke('relaunch_app'),
  getCaps: () => invoke('get_caps'),
  getSession: () => invoke('get_session'),
  setSession: (session) => invoke('set_session', { session }),
  getBootContext: () => invoke('get_boot_context'),
  listHistory: () => invoke('list_history'),
  addHistory: (entry) => invoke('add_history', { entry }),
  clearHistory: () => invoke('clear_history'),

  createPty,
  writePty,
  resizePty: (tabId, cols, rows) => invokePty('pty_resize', { tabId, cols, rows }),
  killPty,
  onPtyData: (tabId, callback) => subscribe(ptyData, tabId, callback),
  onPtyExit: (tabId, callback) => subscribe(ptyExit, tabId, callback),

  clipboardWrite: (text) => writeText(String(text)).catch((error) => {
    console.warn('Clipboard write failed:', error);
  }),
  clipboardRead: () => readText().catch((error) => {
    console.warn('Clipboard read failed:', error);
    return '';
  }),
  openExternal: (url) => invoke('open_external', { url }).catch((error) => console.warn(error)),

  ncAccountStatus: () => invoke('nc_account_status'),
  ncAccountSendOtp: (email) => invoke('nc_account_send_otp', { email }),
  ncAccountVerify: (email, value) => invoke('nc_account_verify', { email, value }),
  ncAccountPassword: (email, password) => invoke('nc_account_password', { email, password }),
  ncAccountLogout: () => invoke('nc_account_logout').catch((error) => {
    console.warn('NatureCo account logout failed:', error);
  }),

  checkForUpdates: noop,
  installUpdate: noop,
  onUpdateAvailable: noopSubscription,
  onUpdateProgress: noopSubscription,
  onUpdateDownloaded: noopSubscription,
  onUpdateNone: noopSubscription,
  onUpdateError: noopSubscription,

  onFocusChange: (callback) => tauriWindowSubscription(
    (handler) => appWindow.onFocusChanged(handler),
    callback,
  ),
  onMaximizeChange: (callback) => tauriWindowSubscription(
    (handler) => appWindow.onResized(async () => handler({ payload: await appWindow.isMaximized() })),
    callback,
  ),
  onOpenDirectory: (callback) => tauriEventSubscription('app:open-directory', callback),
  onNewTab: (callback) => tauriEventSubscription('app:new-tab', callback),
  onCloseTab: (callback) => tauriEventSubscription('app:close-tab', callback),
  onShowSettings: (callback) => tauriEventSubscription('app:show-settings', callback),
  onCloseRequested: (callback) => {
    closeRequested.add(callback);
    return () => closeRequested.delete(callback);
  },
  onSmokeCommand: (callback) => tauriEventSubscription('app:smoke-command', callback),

  completeSmokeTest: (result) => invoke('complete_smoke_test', { result }),

  zlHostStart: () => unsupported('ZeroLink'),
  zlHostStop: noop,
  zlClientConnect: () => unsupported('ZeroLink'),
  zlClientSend: noop,
  zlClientResize: noop,
  zlClientDisconnect: noop,
  zlClientPushFile: () => unsupported('ZeroLink file transfer'),
  zlClientPullFile: () => unsupported('ZeroLink file transfer'),
  zlClientForwardAdd: () => unsupported('ZeroLink port forwarding'),
  zlClientForwardRemove: noop,
  onZlClientFileProgress: noopSubscription,
  onZlClientFileDone: noopSubscription,
  onZlClientFileError: noopSubscription,
  onZlClientForwardOpen: noopSubscription,
  onZlClientForwardError: noopSubscription,
  onZlHostCode: noopSubscription,
  onZlHostTimer: noopSubscription,
  onZlHostExpired: noopSubscription,
  onZlHostConnected: noopSubscription,
  onZlHostSession: noopSubscription,
  onZlHostFile: noopSubscription,
  onZlHostDisconnected: noopSubscription,
  onZlClientConnected: noopSubscription,
  onZlClientRemoteExit: noopSubscription,
  onZlClientDisconnected: noopSubscription,
  onZlError: noopSubscription,
});
