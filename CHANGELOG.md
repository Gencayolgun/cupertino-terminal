# Changelog

## 0.4.0 — 2026-07-13

### macOS
- Moved zsh runtime/history state out of the read-only app bundle and App Translocation into the writable Electron user-data directory.
- Preserved `.zshenv`, `.zprofile`, `.zshrc`, `.zlogin`, and `.zlogout` startup order without modifying user files or sourcing `.zshrc` twice.
- Preserved login startup semantics for bash, added fish OSC integration, and restored common Homebrew paths for Finder-launched GUI sessions.
- Finder open-file actions now open the containing directory. Intel and Apple Silicon DMGs use architecture-specific filenames and the native `.icns` icon.

### Windows
- Preserved Explorer launch directories in WSL instead of forcing `~`.
- Hardened PTY IDs, dimensions, input payloads, duplicate-tab replacement, kill handling, and early output subscription.
- Changed NSIS to consistent per-user installation and architecture-specific installer names.

### Security and reliability
- Pinned the ZeroLink handshake key to the public key in the one-time code, closing an active MITM gap.
- Enforced exact ordered counters, strict code characters, bounded protocol frames, 1 GiB file limits, partial-file cleanup, atomic account-session writes, and safe renderer navigation.
- Disconnected renderer observers on pane close and corrected the PTY benchmark to measure transport throughput rather than PowerShell string allocation.

### Verification
- 25 regression tests, native Electron PTY smoke, full application smoke, PTY throughput benchmark, zero high-severity audit findings, and a real Windows NSIS build.
