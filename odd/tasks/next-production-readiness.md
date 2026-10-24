# Next.js security and production readiness
Branch: `codex/rediseno-integral`. Route: inline; delivery: ask-on-risk, one security work-unit commit followed by readiness documentation. Forecast: under 150 authored lines, generated lockfile excluded.
Checks: npm audit, installed version/peer checks, existing Node tests, clean production build and HTTP smoke checks. Risk: item 5 (production framework dependency update); independent verification required.

## Specs

- S1: "Ok. Solucionemos lo de next y preparemos todo para subirlo a producción" — update the affected Next.js dependency to a verified patched release in the existing major/minor line, synchronize the lockfile and validate the result. Do not change unrelated dependencies without demonstrated need.
- S2: "Sigamos con el logo viejo." — preserve the existing public logo and approved public redesign. The editorial panel and new branding are excluded.
- S3: "preparemos todo para subirlo a producción" — prepare and document the release candidate, checks, configuration requirements, rollback and any remaining authorization. This does not authorize push, merge, deployment, production CMS writes or use of an ambient remote session.
- Assumption: pre-existing FlyerGenerator, proxy-image, package edits and seed scripts are the user's unrelated local work; preserve them without silently including them in the release candidate.

## Tasks

- T1 | S1 | inline | verified, commit pending | Next.js pinned to 16.4.3; lockfile synchronized. RED: one critical affected package. GREEN: zero audit findings, 13 tests passed, full build passed without prior security warning. Existing React 19.0.0 and local html-to-image changes preserved.
- T2 | S1-S2 | inline + independent verification, risk item 5 | pending | Verify the clean committed candidate, existing tests, build, HTTP behavior, logo and dependency changes.
- T3 | S3 | inline | pending | Prepare release/rollback instructions and identify production-only checks and authorizations still required.

## Log

- L1 · 2026-10-24 · User request: "Ok. Solucionemos lo de next y preparemos todo para subirlo a producción".
- L2 · Baseline: branch `codex/rediseno-integral`, HEAD `ea8e6f4`. Existing public redesign is `1d92e7e`. User changes already present in article page, package files, FlyerGenerator, proxy-image and seed scripts; local implementation-status notes also predate this task.
- L3 · RED evidence: `npm audit --json` reports one affected direct package, Next.js 16.4.0, critical aggregate severity. Advisories: GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r, GHSA-673q-mjm6-r5xr; reported affected range through 16.4.0. Registry `next` latest is 16.4.3. No exploitation or deployed-version claim is inferred from this audit.
- L4 · Receipt-driven development is on by default. Candidate review requires the native assessment/consent flow; no approval is presumed. Engram project resolution previously returned `jujuy247-nuevo` but storage rejected it as unknown; mirror pending if still unavailable.
- L5 · Registry peers for 16.4.3 accept the existing React/React DOM 19.0.0; no React upgrade needed. Updated Next, @next/env and platform SWC packages are 16.4.3. Working-tree audit returned zero findings, all 13 tests passed and production build succeeded. The staged package candidate excludes the user's pre-existing html-to-image addition; workspace files retain it. No unrelated application files are staged.
- L6 · Sources: https://github.com/advisories/GHSA-2464-fhr4-w9xw ; https://github.com/advisories/GHSA-p3m5-59mp-jv5r ; https://github.com/advisories/GHSA-673q-mjm6-r5xr . Patch selection and peer compatibility verified with registry metadata and Context7 Next.js documentation.
