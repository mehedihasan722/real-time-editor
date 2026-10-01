const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const app = path.resolve(__dirname, "../apps/web");
const standaloneApp = path.join(app, ".next/standalone/apps/web");
const server = path.join(standaloneApp, "server.js");
if (!fs.existsSync(server)) throw new Error("Run npm run build before starting the production server.");
fs.cpSync(path.join(app, "public"), path.join(standaloneApp, "public"), { recursive: true });
fs.cpSync(path.join(app, ".next/static"), path.join(standaloneApp, ".next/static"), { recursive: true });
const options = process.argv.slice(2);
const port = options.includes("--port") ? options[options.indexOf("--port") + 1] : process.env.PORT ?? "3000";
const hostname = options.includes("--hostname") ? options[options.indexOf("--hostname") + 1] : "0.0.0.0";
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error("Invalid server port.");
const child = spawn(process.execPath, [server], { cwd: app, stdio: "inherit", env: { ...process.env, PORT: port, HOSTNAME: hostname } });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", error => { console.error(error.message); process.exit(1); });
child.on("exit", code => process.exit(code ?? 1));
