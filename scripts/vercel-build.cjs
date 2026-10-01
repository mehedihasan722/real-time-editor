const { spawnSync } = require("node:child_process");
const path = require("node:path");

const app = path.resolve(__dirname, "../apps/web");
// A production deploy key makes backend deployment and the frontend build one Vercel build step.
const command = process.env.CONVEX_DEPLOY_KEY ? "npx" : "npm";
const args = process.env.CONVEX_DEPLOY_KEY
  ? ["convex", "deploy", "--cmd", "npm run build", "--cmd-url-env-var-name", "NEXT_PUBLIC_CONVEX_URL"]
  : ["run", "build"];
if (!process.env.CONVEX_DEPLOY_KEY) console.log("CONVEX_DEPLOY_KEY is unset; building against the existing deployed backend.");
const result = spawnSync(command, args, { cwd: app, stdio: "inherit", shell: process.platform === "win32", env: process.env });
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
