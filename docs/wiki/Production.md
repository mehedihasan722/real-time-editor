# Production and Vercel automation

Authentication redirects default explicitly to `/sign-in` and `/sign-up` in the middleware and Clerk provider, so missing URL environment variables cannot send visitors to an undecorated hosted portal. Existing Clerk and Convex tenant credentials remain paired; do not replace a production tenant with local development credentials to change the artwork.

Flowboard supports the existing Vercel Git integration and an optional CI-gated Actions deployment. Choose one production deployment owner to avoid duplicate deployments.

## Existing Vercel integration

The repository is already connected to Vercel. Pushes to the production branch trigger its normal deployment behavior. Both repository-root and `apps/web` Vercel root configurations have build settings in version control.

Set the required Clerk, Convex, and Liveblocks variables in the Vercel project. Public variables must exist before the build. Set `CONVEX_DEPLOY_KEY` to the production Convex deployment key so the Vercel build script deploys the backend and supplies its URL to the frontend build. Without that key, the frontend builds against the already deployed backend; backend changes must be deployed separately.

Configure Clerk's production issuer as `CLERK_FRONTEND_API_URL` on the production Convex deployment. Also configure `LIVEBLOCKS_SECRET_KEY` on Convex, in addition to Vercel, for room deletion cleanup. Production credentials must belong to the same workspace services.

Reference: [Convex on Vercel](https://docs.convex.dev/production/hosting/vercel).

## CI-gated production deployment

The Quality workflow checks every branch push, tag push, and pull request. It runs TypeScript, lint, regression tests, a production build, Chromium smoke tests, and Docker Compose validation.

The Vercel production workflow runs after a successful main push. It deploys only the checked commit, checks whether that commit is still current, pulls production Vercel configuration, builds it, and deploys the prebuilt output. Configure these GitHub Actions secrets:

| Secret | Purpose |
| --- | --- |
| `VERCEL_TOKEN` | Vercel deployment access |
| `VERCEL_ORG_ID` | Vercel account/team ID |
| `VERCEL_PROJECT_ID` | The intended production project ID |

Protect the GitHub `production` environment as appropriate for your release policy. Once Actions is the deployment owner, disable Vercel's native production auto-deployment in the project settings to prevent duplicate builds. Do not disable the existing integration before Actions credentials are ready.

Reference: [Vercel GitHub Actions guide](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).

## Issues, Projects, Wiki, and gitmoji

- Failed Quality runs on the current main commit create or update one bot issue. Passing main closes that issue. Older runs cannot overwrite the current state.
- Bug and feature templates collect reproduction steps and acceptance criteria. PR titles begin with gitmoji; Dependabot also uses gitmoji.
- Configure the `PROJECT_URL` repository variable and `PROJECT_TOKEN` secret with Projects write access. New/reopened issues and PRs then join that project. GitHub's ordinary repository token cannot write user Projects.
- Wiki source lives in `docs/wiki`. Configure `WIKI_TOKEN` with repository write access to enable Wiki publishing after every main push. The workflow copies maintained pages, retains unrelated existing pages, and generates Recent Changes from the last 20 commits.
- Official GitHub Actions are pinned to verified release commits. Dependabot checks npm and Actions updates weekly.

## Data deletion and operational recovery

Deleting a board immediately removes its Convex board record, preventing fresh room authorization. Favourite records are removed in batches of 200. A durable `roomCleanup` record tracks Liveblocks room deletion. It retries transient failures up to eight attempts with increasing delays; exhausted jobs remain marked `failed` with a sanitized error.

Monitor `roomCleanup` in the Convex dashboard and scheduled-function logs. Correct service credentials or the upstream failure, then retry the internal action:

```sh
npx convex run board:cleanupRoom '{"jobId":"YOUR_CLEANUP_JOB_ID"}' --prod
```

Successful deletion removes the cleanup record. A Liveblocks 404 is already-cleaned success. Existing connected clients may remain connected until the room is deleted, so investigate exhausted cleanup jobs promptly.

## Backup and rollback

Take regular Convex exports and Liveblocks storage backups according to your data-retention needs. Editable JSON board exports provide per-board backups; they exclude comments, user identities, and history. No automated backup schedule is provisioned by this change.

Use Vercel's previous deployment to roll back the frontend. Backend schema migrations need their own compatibility plan; retain optional fields when evolving populated tables. `/api/health` validates configuration only, so use live tests and service dashboards to verify actual connectivity.
