// ── Tema Motoru ──────────────────────────────────────────────────────────────
// macOS Terminal.app tarzı tema sistemi

const ANSI_MAC = {
  black: '#000000',
  red: '#c23621',
  green: '#25bc24',
  yellow: '#adad27',
  blue: '#492ee1',
  magenta: '#d338d3',
  cyan: '#33bbc8',
  white: '#cbcccd',
  brightBlack: '#818383',
  brightRed: '#fc391f',
  brightGreen: '#31e722',
  brightYellow: '#eaec23',
  brightBlue: '#5833ff',
  brightMagenta: '#f935f8',
  brightCyan: '#14f0f0',
  brightWhite: '#e9ebeb',
};

const THEMES = {
  natureco: {
    name: 'NatureCo',
    bgRgb: '6, 18, 12', bgAlpha: 0.9,
    light: false,
    theme: {
      background: '#00000000',
      foreground: '#e6f0ea',
      cursor: '#34d399',
      cursorAccent: '#06120c',
      selectionBackground: 'rgba(52, 211, 153, 0.26)',
      black: '#0e2318',
      red: '#fb7185',
      green: '#34d399',
      yellow: '#fcd34d',
      blue: '#818cf8',
      magenta: '#f472b6',
      cyan: '#22d3ee',
      white: '#e6f0ea',
      brightBlack: '#4b6358',
      brightRed: '#fda4af',
      brightGreen: '#6ee7b7',
      brightYellow: '#fde68a',
      brightBlue: '#a5b4fc',
      brightMagenta: '#f9a8d4',
      brightCyan: '#67e8f9',
      brightWhite: '#f0f7f3',
    },
  },
  pro: {
    name: 'Pro',
    bgRgb: '30, 30, 30', bgAlpha: 0.82,
    light: false,
    theme: {
      background: '#00000000',
      foreground: '#f2f2f2',
      cursor: '#f2f2f2',
      cursorAccent: '#1e1e1e',
      selectionBackground: 'rgba(120, 150, 210, 0.38)',
      black: '#1e1e1e',
      red: '#ff5f56',
      green: '#27c93f',
      yellow: '#ffbd2e',
      blue: '#5da3fa',
      magenta: '#bf68d9',
      cyan: '#5ad4d4',
      white: '#f2f2f2',
      brightBlack: '#6b6b6b',
      brightRed: '#ff8783',
      brightGreen: '#5af78e',
      brightYellow: '#f3f99d',
      brightBlue: '#9aedfe',
      brightMagenta: '#d2a8ff',
      brightCyan: '#a4ffff',
      brightWhite: '#ffffff',
    },
  },
  basic: {
    name: 'Basic',
    bgRgb: '255, 255, 255', bgAlpha: 1,
    light: true,
    theme: {
      background: '#00000000',
      foreground: '#000000',
      cursor: '#5b5b5b',
      cursorAccent: '#ffffff',
      selectionBackground: 'rgba(164, 205, 255, 0.65)',
      ...ANSI_MAC,
    },
  },
  homebrew: {
    name: 'Homebrew',
    bgRgb: '0, 0, 0', bgAlpha: 1,
    light: false,
    theme: {
      background: '#00000000',
      foreground: '#28fe14',
      cursor: '#23ff18',
      cursorAccent: '#000000',
      selectionBackground: 'rgba(40, 254, 20, 0.22)',
      ...ANSI_MAC,
    },
  },
  manPage: {
    name: 'Man Page',
    bgRgb: '254, 244, 156', bgAlpha: 1,
    light: true,
    theme: {
      background: '#00000000',
      foreground: '#000000',
      cursor: '#7f7f7f',
      cursorAccent: '#fef49c',
      selectionBackground: 'rgba(169, 193, 226, 0.75)',
      ...ANSI_MAC,
    },
  },
  novel: {
    name: 'Novel',
    bgRgb: '223, 219, 195', bgAlpha: 1,
    light: true,
    theme: {
      background: '#00000000',
      foreground: '#3b2322',
      cursor: '#73635a',
      cursorAccent: '#dfdbc3',
      selectionBackground: 'rgba(164, 163, 144, 0.7)',
      ...ANSI_MAC,
    },
  },
  ocean: {
    name: 'Ocean',
    bgRgb: '34, 79, 188', bgAlpha: 1,
    light: false,
    theme: {
      background: '#00000000',
      foreground: '#ffffff',
      cursor: '#7f7f7f',
      cursorAccent: '#224fbc',
      selectionBackground: 'rgba(33, 109, 255, 0.75)',
      ...ANSI_MAC,
    },
  },
  grass: {
    name: 'Grass',
    bgRgb: '19, 119, 61', bgAlpha: 1,
    light: false,
    theme: {
      background: '#00000000',
      foreground: '#fff0a5',
      cursor: '#8c2800',
      cursorAccent: '#fff0a5',
      selectionBackground: 'rgba(182, 73, 38, 0.75)',
      ...ANSI_MAC,
    },
  },
  redSands: {
    name: 'Red Sands',
    bgRgb: '122, 37, 30', bgAlpha: 1,
    light: false,
    theme: {
      background: '#00000000',
      foreground: '#d7c9a7',
      cursor: '#ffffff',
      cursorAccent: '#7a251e',
      selectionBackground: 'rgba(164, 163, 144, 0.55)',
      ...ANSI_MAC,
    },
  },
  silverAerogel: {
    name: 'Silver Aerogel',
    bgRgb: '146, 146, 146', bgAlpha: 0.88,
    light: true,
    theme: {
      background: '#00000000',
      foreground: '#000000',
      cursor: '#404040',
      cursorAccent: '#929292',
      selectionBackground: 'rgba(120, 120, 120, 0.55)',
      ...ANSI_MAC,
    },
  },
  solidColors: {
    name: 'Solid Colors',
    bgRgb: '255, 255, 255', bgAlpha: 1,
    light: true,
    theme: {
      background: '#00000000',
      foreground: '#000000',
      cursor: '#7f7f7f',
      cursorAccent: '#ffffff',
      selectionBackground: 'rgba(164, 205, 255, 0.65)',
      black: '#000000',
      red: '#ff0000',
      green: '#00ff00',
      yellow: '#ffff00',
      blue: '#0000ff',
      magenta: '#ff00ff',
      cyan: '#00ffff',
      white: '#ffffff',
      brightBlack: '#666666',
      brightRed: '#ff0000',
      brightGreen: '#00ff00',
      brightYellow: '#ffff00',
      brightBlue: '#0000ff',
      brightMagenta: '#ff00ff',
      brightCyan: '#00ffff',
      brightWhite: '#ffffff',
    },
  },
};

function currentTheme(settings) {
  return THEMES[settings.profile] || THEMES.pro;
}

function terminalTheme(settings) {
  return { ...currentTheme(settings).theme, background: 'rgba(0, 0, 0, 0)' };
}

function effectiveAlpha(settings) {
  const th = currentTheme(settings);
  return settings.opacity == null ? th.bgAlpha : settings.opacity;
}

module.exports = { THEMES, ANSI_MAC, currentTheme, terminalTheme, effectiveAlpha };
