# Production readiness review — 4 October 2026

The repository supports production development with an existing release pipeline. This review hardens one upstream resource boundary and corrects local Docker instructions. A public launch still requires verification of the connected production services and recovery procedures.

## Coverage and architecture

Reviewed workspace manifests, shared packages, application and API structure, authentication proxy, organization and role boundaries, Convex board/vector operations, AI quotas and provider requests, monitoring, offline service worker, environment validation, production startup, Docker/Compose, GitHub workflows, deployment scripts, and automated test coverage. This is a repository review, not a line-by-line security certification or a live service/load audit.

| Area | Assessment |
| --- | --- |
| Workspace | Next.js application plus shared types, UI, hooks, utilities, and configuration; npm lockfile and Turborepo checks already present. |
| Access control | Clerk protects routes; board queries, mutations, AI reservations, and Liveblocks room authorization check organization access. Editing and admin operations enforce roles. Existing regressions cover foreign tenants and guest writes. |
| Data integrity | Convex vector writes validate geometry and versions, enforce layer limits, and maintain counters. Board deletion schedules batched data cleanup and durable room cleanup with retries. |
| AI boundary | Submitted messages and validated attachments are forwarded; quota, request limits, timeouts, HTTPS checks, redirect rejection, and streaming limits exist. Non-streaming text responses previously parsed unlimited JSON before checking message length. Fixed below. |
| Runtime | Standalone production server, non-root Docker user, readiness endpoint, security headers, setup fallback, error boundaries, and optional sanitized Sentry integration exist. Readiness checks configuration, not upstream connectivity. |
| Release pipeline | CI runs typecheck, lint, regressions, production build, browser tests, and Compose validation. Optional Vercel workflow deploys the checked main revision. Actual repository protections and hosting settings were not inspected. |
| Browser coverage | Most interaction tests use fixtures for authentication and collaborative state. The separate live suite requires dedicated authenticated sessions. |

## Changes made

- Added a bounded JSON reader for upstream AI responses. Text completion responses stop at 1,000,000 decoded bytes; generated-image responses retain their existing 14,000,000-byte limit. Both paths cancel and release their readers on success or failure. The limit applies even without a Content-Length header.
- Added a route regression proving oversized upstream responses return a sanitized 502 and cancel the stream, with and without a declared response length.
- Corrected the development Docker URL to port 3031, matching Compose, and documented the existing FLOWBOARD_DOCKER_PORT override.
- Replaced an immediate reduced-motion style assertion with a polling assertion so the WebKit browser has time to apply the emulated media preference. No product animation behavior was weakened.

## Release conditions

The full npm audit reports five high-severity package entries in one development-only chain: eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces. The root issue is [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), a denial of service from deeply nested brace patterns. The advisory lists no patched version, and the registry's latest braces remains 3.0.3. The production-only audit reports zero vulnerabilities. Keep lint patterns controlled by repository configuration and track an upstream compatible fix; npm's suggested major downgrade to eslint-config-next 14.2.35 was not applied to this Next.js 16 project.

## Verification

- TypeScript: passed across the workspaces.
- ESLint: passed for the application and shared packages.
- Regression suite: 127 passed, zero failed.
- Browser coverage: all 75 distinct checks passed across Chromium, WebKit, and mobile emulation across the initial run and focused rerun. The initial run had 72 passes and three WebKit reduced-motion assertion failures; after the polling fix, all seven WebKit carousel tests passed. Firefox was not run locally.
- Optimized standalone production build: passed after the changes.
- Development and production Compose configuration: both validated successfully.
- Production dependencies: zero known npm audit vulnerabilities at review time; the development advisory above remains open.

## Remaining launch checks

1. Configure matching production Clerk, Convex, and Liveblocks projects. Set the Clerk issuer and Liveblocks cleanup key on Convex; keep server credentials out of frontend build arguments. Validate actual login, organization selection, invitation delivery, member/guest/admin access, and two simultaneous collaborators.
2. Run the documented live suite with dedicated test accounts. Verify board creation, both canvas engines, reconnect behavior, comments, exports/imports, deletion, and configured AI providers against the intended production backend.
3. Choose one production deployment owner: Vercel Git integration or CI-gated Actions. Verify branch protections and required checks in GitHub, since configuration files alone do not enforce them.
4. Configure error monitoring and availability alerts, including failed roomCleanup jobs. Exercise frontend rollback and restore a Convex/Liveblocks backup before relying on a recovery promise. No automated backup schedule was provisioned.
5. Measure representative large boards and concurrent sessions on target devices. Existing canvas limits and functional tests do not establish a production throughput or latency guarantee.

See [production operations](wiki/Production.md) and [testing instructions](wiki/Testing.md) for existing deployment and live-test procedures. No deployment, secret changes, or external data mutations were performed during this review.
