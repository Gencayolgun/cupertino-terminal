# Cupertino Terminal — Tauri Migration Plan (Rocks)

Dependency-ordered. Claude (Visionary) hands each rock to Codex (Integrator) as a frozen
build contract, reviews the full diff, and runs the proof command itself. No rock is "done"
until its proof passes when Claude runs it.

Migration is **in-place**: the existing `src/` renderer is kept; a new `src-tauri/` Rust
crate replaces the Electron main process. Electron is removed only once Rock 2 reaches parity.

---

## Rock 0 — Toolchain + native-WebView skeleton + feasibility gates
- **Do:** Install Rust (GNU locally for edit/run speed). Scaffold a Tauri v2 app that loads the
  existing renderer in the OS-native WebView. **The renderer cannot load unchanged** — `index.html`
  imports `../node_modules/...` ESM and expects `window.termAPI` from Electron's preload. So Rock 0
  must include: (a) a **frontend bundling** step producing a valid Tauri asset bundle, and (b) a
  **`termAPI` compatibility facade** (JS shim) loaded before `renderer.js` that maps the existing
  `termAPI` surface onto Tauri commands/channels — so `renderer.js` changes stay minimal.
  Also in Rock 0: **WebGL2 capability probing** with a retained DOM fallback, and a first
  **WKWebView/WebView2 rendering matrix** smoke (font metrics, transparency, selection).
- **Done looks like:** a native window renders the Cupertino UI (tabs, theme, chrome), WebGL probed
  with DOM fallback confirmed, no bundled Chromium runtime.
- **Proof:** `cargo tauri build` (GNU) completes AND CI runs an **MSVC `cargo check` + unsigned
  bundle smoke** (see toolchain note) — both from Rock 0, not deferred. Launching the built app
  shows the rendered UI on Windows and macOS.

## Rock 1 — PTY on portable-pty (Channel streaming + backpressure)
- **Do:** Rust Tauri commands `pty_create / pty_write / pty_resize / pty_kill`. **PTY output streams
  over one ordered `tauri::ipc::Channel` per PTY, created atomically with the PTY** — NOT
  dynamically-named `pty:data:${tabId}` events (Tauri events are global/JSON-only and unfit for
  high-volume streaming). Each PTY needs: a blocking reader worker, a single-take synchronized
  writer (portable-pty's writer can only be taken once), an exit waiter, and deterministic teardown.
  **Batch output by bytes/time, cap queued bytes, coalesce/pause when xterm falls behind
  (backpressure).** Do NOT `from_utf8_lossy` each read independently — split UTF-8 across reads
  corrupts; use binary transport or a stateful decoder feeding xterm's queued `write` callback.
  Reuse `pty-params.js` validation semantics (tab-id, dimensions, input bounds) on the Rust side.
- **Done looks like:** typing runs a real shell (zsh/bash/fish on Unix, PowerShell/WSL/cmd on
  Windows); resize reflows; exit is clean; a `cat large-file` / `yes` flood stays smooth with
  bounded memory and no dropped/corrupted bytes.
- **Proof:** an automated test at the **Rust PTY service layer** (below Tauri) spawns a shell,
  runs `echo`/`pwd`, asserts round-tripped output, AND a sustained-output + Unicode-boundary test;
  plus a separate app-level smoke/stress test for Channel→xterm streaming.

## Spike S1 — webrtc-rs non-trickle DataChannel + JS↔Rust crypto interop (de-risk before Rock 2)
- **Why here:** Rock 3 is the highest-risk work; prove the two scariest unknowns in isolation
  *before* investing in the whole Rock 2 parity port.
- **Do:** (a) A throwaway `webrtc-rs` spike: two peers, non-trickle (`gathering_complete_promise`),
  one SDP offer/answer over a single UDP datagram, a DataChannel that carries bytes both ways —
  and check the SDP still fits one UDP JSON datagram (TURN candidates can push it into IP
  fragmentation; add a size guard / envelope if needed). (b) **Golden-vector interop**: freeze
  deterministic JS-generated vectors (injected nonce) for `encodeZeroCode`, `buildHandshake`
  (transcript `ZLHS || compressed_pubkey(33B SEC1) || nonce`), and the AES-256-GCM frame; a Rust
  impl must reproduce and verify them — proving **old-JS ↔ Rust interop**, not just Rust↔Rust.
- **Proof:** the spike connects two webrtc-rs peers and round-trips a DataChannel message; the Rust
  crypto reproduces every frozen JS golden vector byte-for-byte and rejects a wrong pairing key.

## Rock 2 — Feature parity with the Electron app (Electron NOT yet removed)
- **Do:** Port the full main-process IPC surface to Tauri — a **checked inventory of the entire
  preload**, not a partial list: window controls (min/max/close, traffic lights, focus/blur,
  maximize state), settings store (electron-store → a JSON store), clipboard, `openExternal`,
  deep-link (`terminal://`/`shell://`), session persistence, splits, command history, **NatureCo
  account auth (SSO), the updater lifecycle, boot context, native menus, close-confirmation,
  open-directory handling, and the smoke-test hooks**.
- **Do NOT remove Electron here.** ZeroLink still runs on Electron/Node until Rock 3; removing
  Electron now would break the remote-terminal feature. Both shells coexist until Rock 3 parity.
- **Done looks like:** every feature exercised by the current app smoke test works on Tauri (with
  ZeroLink still served by the legacy path).
- **Proof:** the migrated smoke test (equivalent of `smoke:app`) passes; a checklist of every
  ported preload method verified present and working.

## Rock 3 — ZeroLink over Rust webrtc-rs (the risky one; removes Electron)
- **Do:** Build on Spike S1. Port `zerolink-crypto/proto/transfer/host/client/peer` to Rust on
  `webrtc-rs`. Reproduce the code + handshake wire format **byte-exact**, including the v0.5.0
  pairing-key HMAC mutual auth (guard the 33-byte compressed SEC1 P-256 point representation —
  an uncompressed 65-byte point, DER/SPKI, or base64 silently breaks both proof and key
  derivation). Port ZeroLink in layers: crypto/code golden vectors → JS↔Rust handshake interop →
  minimal reliable DataChannel → PTY bridge → file transfer/forwarding. **Once ZeroLink reaches
  parity on Rust, remove Electron/node-pty/node-datachannel entirely.**
- **Done looks like:** a real host↔client encrypted session works across machines on the Tauri
  build; a party without the code cannot connect; Electron is gone.
- **Proof:** the existing ZeroLink test suite (30 tests) reproduced against the Rust impl including
  the attacker-rejection test, the JS↔Rust golden-vector interop from S1, all green; live
  cross-device run on the Tauri build.

## Rock 4 — macOS flawlessness (Windows parity)
- **Do:** Fix the concrete macOS UX bugs the user enumerates. Correct native vibrancy/traffic-light
  geometry, retina/HiDPI rendering, IME/dead-keys, Option/Meta behavior, selection/clipboard,
  focus, and any crash/visual defects. **macOS acceptance checks run throughout Rocks 0–3**, so
  Rock 4 polishes *known* failures — it must not be where we first discover architectural WebKit
  incompatibilities.
- **Done looks like:** macOS behaves identically to Windows for every listed bug; nothing degraded.
- **Proof:** real Mac verification over SSH/live for each enumerated bug; before/after evidence.

## Rock 5 — Performance: prove the 10x targets
- **Do:** Enable the xterm WebGL renderer; optimize startup (lazy work, minimal WebView payload);
  measure keystroke latency, cold start, and memory. Compare against Windows Terminal.
- **Done looks like:** cold start < 300 ms, keystroke-to-glyph < 10 ms, idle memory well below the
  Electron build and Windows Terminal.
- **Proof:** a benchmark script reports the numbers; documented side-by-side vs Windows Terminal.

## Rock 6 — Packaging + auto-update + CI
- **Do:** Tauri bundler → `.dmg` (mac arm64+x64), `.msi`/NSIS (win, MSVC in CI), `.AppImage`
  (linux). Wire the Tauri updater. Update the GitHub Actions workflow to build/verify all targets.
- **Done looks like:** tagged release produces working signed-where-possible installers; updater
  moves an install from N-1 to N.
- **Proof:** CI green on all platforms producing real installer artifacts; a manual N-1 → N update.

---

## Same Page gates
Before Codex builds each rock, Claude runs a bounded Same Page Meeting with Codex (read-only
review of that rock's contract). Round 1 (this plan) is logged in `SAME-PAGE-LOG.md` with verdict
`SAME PAGE` after the revisions above. Per-rock verdicts recorded as we go.

## Toolchain note — GNU local, MSVC in CI from Rock 0 (revised)
Tauri officially supports/recommends the **MSVC** Windows target; GNU-only dev is an *unsupported
divergence*, not just a packaging detail (target-specific C/C++ crypto build scripts, CRT/linker
differences, MinGW runtime DLL leakage, crates that build on GNU but fail on MSVC). MSI generation
also requires Windows + WiX + the VBSCRIPT feature. **Decision:** keep GNU locally for edit/run
speed, but CI runs an **MSVC `cargo check` + tests + unsigned bundle smoke starting at Rock 0** —
GNU artifacts/caches never feed release packaging.

## Risk register
- **Rock 3 (webrtc-rs)** — highest risk. Mitigation: Spike S1 proves the non-trickle DataChannel
  and JS↔Rust golden-vector interop in isolation *before* Rock 2; keep the pure crypto/proto layer
  unchanged in shape; guard the 33-byte compressed SEC1 point.
- **Signaling datagram size** — webrtc-rs SDP (esp. with TURN candidates) may exceed one UDP JSON
  datagram → IP fragmentation. Add a size guard / fragmentation or a small signaling envelope.
- **PTY streaming** — wrong IPC primitive (events vs Channel) or missing backpressure/UTF-8-boundary
  handling corrupts output or freezes the UI. Addressed head-on in Rock 1.
- **WebView rendering differences** — WKWebView (mac) and WebView2 (win) render xterm differently
  than Chromium; surfaced from Rock 0 via the rendering matrix, not deferred to the end.
- **GNU vs MSVC** — see toolchain note; MSVC gate runs from Rock 0.
