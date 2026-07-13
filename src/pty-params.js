'use strict';

function normalizeTabId(value) {
  const id = String(value || '');
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) throw new Error('Invalid terminal tab id');
  return id;
}

function normalizeDimensions(cols, rows) {
  const clamp = (value, fallback, max) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(1, Math.min(max, Math.trunc(number))) : fallback;
  };
  return { cols: clamp(cols, 80, 1000), rows: clamp(rows, 30, 500) };
}

function normalizePtyInput(value) {
  if (typeof value !== 'string') return null;
  return value.length > 1024 * 1024 ? value.slice(0, 1024 * 1024) : value;
}

module.exports = { normalizeTabId, normalizeDimensions, normalizePtyInput };
