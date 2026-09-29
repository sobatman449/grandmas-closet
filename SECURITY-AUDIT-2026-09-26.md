# Grandma’s Closet security scan — 2026-09-26

**Status:** Local, uncommitted review note on `feature/security-audit-report-2026-09-26`. No dependencies or installer artifacts were changed.

## Snapshot and method

[Certain] Trivy 0.74.0 scanned the project filesystem on 2026-09-26 with vulnerability, misconfiguration, secret, and license scanners; development dependencies were included, telemetry disabled, and offline scan mode used. The source checkout was `main` at `b81ff3d`, with an untracked Windows installer ZIP. The installer ZIP was excluded by project scope. This note is on a separate clean branch from `main`.

The temporary machine-readable scan artifacts were removed after the run. This is a summary, not a retained Trivy JSON/SARIF report. Docker was unavailable, so no image scan was performed.

## Results

[Certain] Trivy reported **108 vulnerability entries**: 1 critical, 51 high, 45 medium, and 11 low. These include development dependencies and are entries, not necessarily distinct or exploitable issues.

- Critical: `tar@7.5.15`; Trivy reported `7.5.19` as the fix.
- High-severity examples include Electron `32.3.3` and `@xmldom/xmldom@0.8.13`. The exact advisory list should be refreshed before remediation.
- No secret-pattern matches were reported in the scanned project scope.

## Follow-up

- Review a fresh full Trivy report, update affected direct/transitive dependencies, then run the documented project checks and Windows installer smoke test.
- Re-scan the installer artifact separately if it becomes part of the security-review scope; this filesystem scan did not assess the untracked ZIP.

## Remediation — 2026-09-28

`npm audit` went from **30 vulnerabilities (1 critical, 22 high, 3 moderate, 4 low) to 3**,
all three of which are the same blocked Electron upgrade. Everything closed was
semver-compatible: `npm audit fix` with no `--force`, so `package.json` is untouched and
the whole change is `package-lock.json`.

Cleared, among others:

| Library | Advisory class |
| --- | --- |
| `tar` 7.5.15 → fixed line | The critical: infinite loop on negative entry size, plus NUL-byte PAX DoS and uncontrolled recursion |
| `undici` | 7 advisories — header injection, response-queue poisoning, CRLF injection, cookie attribute injection |
| `ws` | Uninitialized memory disclosure; fragment-based memory exhaustion |
| `vite` | `server.fs.deny` bypass on Windows alternate paths; `launch-editor` NTLMv2 hash disclosure |
| `tmp` | Path traversal via unsanitized prefix/postfix |

**Verified:** Trivy 0.74.0 `--include-dev-deps`, severity CRITICAL → **0**.
`npm run build` completes (client, WASM assets, and the esbuild server bundle).

### Update, same day — Electron upgrade done, repo is now at 0

Jay authorized the Electron work, so the section below is **resolved**. Final state:
`npm audit` → **0 vulnerabilities**, Trivy `--include-dev-deps` → **0**.

| Change | Why |
| --- | --- |
| `electron` 32.3.3 → **44.4.5** | Clears all 23 advisories, including the context-isolation bypass and the `shell.openPath` null-byte bypass. Drags `extract-zip` out with it |
| `electron-builder` 26.8.1 → **26.15.3** | Needed for Electron 44 support |
| `better-sqlite3` 12.9.0 → **13.0.3** | **Required, not optional.** 12.9.0 does not compile against Electron 44's V8: `v8::External::New` now takes a third `ExternalPointerTypeTag` argument, so `node-gyp` fails with "too few arguments to function call, expected 3, have 2" |
| `drizzle-orm` 0.39.3 → **0.45.3** | GHSA-gpj5-g38j-94v9, SQL injection via improperly escaped SQL identifiers. Surfaced once Electron stopped masking the tree. Low practical risk here — identifiers come from `shared/schema.ts`, not user input, against a local SQLite file — but it is a one-line fix with a 3-reference surface (`server/storage.ts`, `shared/schema.ts`) |

**Breaking changes 33 → 44 were checked against `electron/main.js` and none apply.** It
uses only `app`, `BrowserWindow`, `whenReady`, `getPath('userData')` and `loadURL`. The
notable removals in that range — `session.setPreloads` (35), the `UNNotification`
migration (42), `dialog.defaultPath` (43), and the pre-macOS-13 login-item attributes
(44) — touch nothing in this file. `nodeIntegration: false` / `contextIsolation: true`
were already correct.

#### How the native module was actually verified

Compiling is not the same as loading, so both were checked:

1. `electron-builder --mac --dir` completed: `better-sqlite3` rebuilt for `arm64` and the
   app packaged through to code-signing (skipped — no Developer ID on this machine).
2. A real round trip inside Electron 44's main process — `CREATE TABLE`, `INSERT`,
   `SELECT` — returned the inserted row:

   ```
   ELECTRON 44.4.5 | NODE 24.21.0 | MODULES 149
   SQLITE_ROUNDTRIP {"name":"test coat"}
   ABI_CHECK_PASS
   ```

`npm run build` passes. `tsc --noEmit` reports only the pre-existing `bgRemove.ts` error
described at the end of this file — no new type errors from any of the four upgrades.

#### Still not done: the Windows installer

`electron:build:win` was **not** run — it needs Windows, and this pass was on macOS. The
macOS `--dir` package proves the Electron 44 ABI and the `better-sqlite3` rebuild, which
was the real unknown, but the NSIS installer and a launch on Windows remain untested.
Run `npm run electron:build:win` and open the app once before shipping a build to anyone.

One note if that is run from a different checkout: `node-gyp` warns
"Attempting to build a module with a space in the path" for `bufferutil` here, because
this worktree sits under `Don Hell/`. The live checkout at
`/Volumes/Galacticon/Playground/grandmas-closet` has no space and will not hit it.

### Original assessment — resolved by the above

**`electron@32.3.3` carries 23 advisories and the only fix is `electron@44`, twelve major
versions on.** `extract-zip` is dragged along with it. This is not a transitive build-time
DoS like the rest of the list — Electron *is* the runtime of the shipped desktop app, and
the advisories include context-isolation bypass via `Function.prototype.bind`, several
use-after-frees, `shell.openPath` validation bypass via an embedded null byte, and
DevTools handlers that execute arbitrary files through shell open.

It was left alone deliberately. It is a migration, not a bump, and this report's own
follow-up asks for a Windows installer smoke test that cannot be run from macOS. It
should be scheduled as its own piece of work rather than folded into a dependency sweep.

### Pre-existing, unrelated to this change

`npm run check` fails: `client/src/lib/bgRemove.ts(22,37): error TS2554: Expected 1
arguments, but got 2`. `@imgly/background-removal` is pinned at `1.7.0` in both the
before and after lockfiles, so this typecheck was already broken before the security
work and is not a regression from it. Worth its own fix.
