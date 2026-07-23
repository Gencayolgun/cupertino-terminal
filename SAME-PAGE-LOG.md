# Same Page Log — Tauri Migration

## Round 1 — plan review (Codex read-only, gpt-5.6-sol)

Codex reviewed `MIGRATION-VTO.md` + `MIGRATION-PLAN.md` against the actual code. Verdict came back
`NEEDS CHANGES` with specific, correct findings. Visionary (Claude) response to each — **all
accepted**; the revisions are now in the plan/VTO.

| # | Codex finding | Response | Change made |
|---|---|---|---|
| 1 | Renderer can't load unchanged — `index.html` imports `../node_modules/...` ESM; `window.termAPI` comes from Electron preload. | **Accept.** Correct. | Rock 0 now requires a frontend bundling step + a `termAPI` compatibility facade before `renderer.js`. |
| 2 | Electron IPC isn't mechanically replaceable; PTY output must use one ordered `tauri::ipc::Channel` per PTY, not dynamically-named `pty:data:${id}` events (global, JSON-only, unfit for streaming). | **Accept.** This is the key architecture correction. | Rock 1 rewritten around one Channel per PTY created atomically with it. |
| 3 | Backpressure missing; portable-pty blocking handles, single-take writer, batch/cap/coalesce, and don't `from_utf8_lossy` per read (splits corrupt UTF-8). | **Accept.** | Rock 1 now specifies reader worker, single-take writer, exit waiter, backpressure, and stateful/binary UTF-8-safe transport. |
| 4 | Renderer/WebView risk begins in Rock 0, not Rock 5 (WebGL2, WKWebView quirks, IME, transparency). | **Accept.** | Rock 0 adds WebGL2 probing + DOM fallback + an early WKWebView/WebView2 rendering matrix; macOS checks run through Rocks 0–3. |
| 5 | "No Chromium anywhere" is wrong — WebView2 *is* system Chromium. | **Accept.** | VTO reworded to "no **bundled** Electron/Chromium runtime." |
| 6 | Perf targets not testable as written; <10 ms keystroke-to-glyph impossible at 60 Hz (16.7 ms frame). | **Accept.** | VTO targets now define measurement method, percentiles, hardware; latency reframed to sub-frame commit (p95) + a sustained-throughput/backpressure target. |
| 7 | Rock 2 IPC inventory incomplete (account auth, updater, file-transfer/forwarding, boot context, menus, close-confirm, open-directory, smoke hooks). | **Accept.** | Rock 2 now demands a checked inventory of the entire preload surface. |
| 8 | Rock 3: choose `webrtc-rs` over `str0m` (str0m is sans-I/O + trickle-only → ICE/TURN project). | **Accept.** | Locked `webrtc-rs` in VTO + Rock 3; str0m rejected with reason. |
| 9 | Byte-exact hazard: 33-byte compressed SEC1 P-256 point; require JS↔Rust golden-vector interop, not Rust↔Rust. | **Accept.** | Added Spike S1 (golden vectors + JS↔Rust interop) and called out the point encoding in Rock 3. |
| 10 | webrtc-rs SDP may exceed one UDP JSON datagram (TURN → fragmentation). | **Accept.** | Added to Spike S1 + risk register (size guard / envelope). |
| 11 | Don't remove Electron at Rock 2 — ZeroLink needs Node until Rock 3. | **Accept.** Important; my draft removed it too early. | Electron removal moved to Rock 3; Rock 2 explicitly keeps both shells coexisting. |
| 12 | Retire risk earlier: WebRTC spike right after Rock 1; perf baselines in Rock 0/1; macOS checks throughout. | **Accept.** | Added Spike S1 between Rock 1 and Rock 2; baselines + macOS checks folded into Rocks 0–3. |
| 13 | GNU-only is an unsupported divergence; run MSVC check/tests/bundle-smoke in CI from Rock 0, not Rock 6. | **Accept** (keep GNU locally for speed, add MSVC CI gate from Rock 0). | Added the toolchain note; Rock 0 proof now includes an MSVC CI gate. |

**Rejections:** none — every finding was correct and materially improved the plan.

### VERDICT: SAME PAGE
Plan + VTO revised per all 13 findings. Cleared to start Rock 0 (Rust toolchain is installed;
scaffold + bundling + termAPI facade + WebGL probe + MSVC CI gate).
