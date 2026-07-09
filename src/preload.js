const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('termAPI', {
  // Pencere kontrolleri
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Shell profilleri
  listShells: () => ipcRenderer.invoke('shell:list'),

  // Ayarlar (tema/profil, yazi boyutu, imlec, kabuk) — kalici
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.send('settings:set', settings),
  relaunch: () => ipcRenderer.send('app:relaunch'),
  getCaps: () => ipcRenderer.invoke('sys:caps'),

  // PTY yasam dongusu
  createPty: (tabId, profileKey, cols, rows) => ipcRenderer.invoke('pty:create', { tabId, profileKey, cols, rows }),
  writePty: (tabId, data) => ipcRenderer.send('pty:write', { tabId, data }),
  resizePty: (tabId, cols, rows) => ipcRenderer.send('pty:resize', { tabId, cols, rows }),
  killPty: (tabId) => ipcRenderer.send('pty:kill', { tabId }),

  onPtyData: (tabId, callback) => {
    const channel = `pty:data:${tabId}`;
    const listener = (event, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  onPtyExit: (tabId, callback) => {
    const channel = `pty:exit:${tabId}`;
    const listener = (event, code) => callback(code);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },

  // Pano (kopyala/yapistir) — ana surecin clipboard modulu uzerinden (izin/prompt yok)
  clipboardWrite: (text) => ipcRenderer.send('clipboard:write', text),
  clipboardRead: () => ipcRenderer.invoke('clipboard:read'),

  // Pencere odak/blur — traffic-light'lari griye cevirmek icin (macOS davranisi)
  onFocusChange: (callback) => {
    const listener = (event, focused) => callback(focused);
    ipcRenderer.on('window:focus', listener);
    return () => ipcRenderer.removeListener('window:focus', listener);
  },

  // Maximize/restore — maximize'da pencere koselerini duzlestirmek icin
  onMaximizeChange: (callback) => {
    const listener = (event, maximized) => callback(maximized);
    ipcRenderer.on('window:maximized', listener);
    return () => ipcRenderer.removeListener('window:maximized', listener);
  },
});
