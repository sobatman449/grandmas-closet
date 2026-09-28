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

### Blocked — needs Jay, and it is the real risk here

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
