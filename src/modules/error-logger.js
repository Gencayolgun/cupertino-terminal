// ── Hata Günlüğü Utility'si ──────────────────────────────────────────────────
// Boş catch blokları için standart hata kayıt mekanizması

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class ErrorLogger {
  constructor(options = {}) {
    this.level = options.level || LOG_LEVELS.WARN;
    this.logFile = options.logFile || null;
    this.prefix = options.prefix || '[CupertinoTerminal]';
  }

  _formatMessage(level, msg, err) {
    const timestamp = new Date().toISOString();
    const base = `${timestamp} ${this.prefix} [${level}] ${msg}`;
    if (err && err.stack) {
      return `${base}\n${err.stack}`;
    }
    return base;
  }

  debug(msg, err) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.debug(this._formatMessage('DEBUG', msg, err));
    }
  }

  info(msg, err) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this._formatMessage('INFO', msg, err));
    }
  }

  warn(msg, err) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(this._formatMessage('WARN', msg, err));
    }
  }

  error(msg, err) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(this._formatMessage('ERROR', msg, err));
    }
  }

  // Güvenli temizlik fonksiyonu - hata yakalama ile
  safeKill(process, context) {
    try {
      if (process && typeof process.kill === 'function') {
        process.kill();
      }
    } catch (err) {
      this.warn(`Process kill failed (${context})`, err);
    }
  }

  safeResize(pty, cols, rows, context) {
    try {
      if (pty && typeof pty.resize === 'function') {
        pty.resize(cols, rows);
      }
    } catch (err) {
      this.warn(`PTY resize failed (${context})`, err);
    }
  }

  safeWrite(pty, data, context) {
    try {
      if (pty && typeof pty.write === 'function') {
        pty.write(data);
      }
    } catch (err) {
      this.warn(`PTY write failed (${context})`, err);
    }
  }

  safeFileOp(operation, context) {
    try {
      return operation();
    } catch (err) {
      this.warn(`File operation failed (${context})`, err);
      return null;
    }
  }

  safeClose(server, context) {
    try {
      if (server && typeof server.close === 'function') {
        server.close();
      }
    } catch (err) {
      this.warn(`Server close failed (${context})`, err);
    }
  }

  safeDestroy(socket, context) {
    try {
      if (socket && typeof socket.destroy === 'function') {
        socket.destroy();
      }
    } catch (err) {
      this.warn(`Socket destroy failed (${context})`, err);
    }
  }
}

// Global logger instance
const logger = new ErrorLogger({
  level: process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN,
});

module.exports = { ErrorLogger, logger, LOG_LEVELS };
