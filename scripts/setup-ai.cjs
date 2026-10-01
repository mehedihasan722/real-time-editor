const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const home = path.join(root, ".local-tools/hermes");
const envFile = path.join(root, ".local-tools/ai.env");
fs.mkdirSync(home, { recursive: true });
if (!fs.existsSync(envFile)) fs.writeFileSync(envFile, `FLOWBOARD_HERMES_KEY=${crypto.randomBytes(32).toString("hex")}\n`, { mode: 0o600 });
const key = fs.readFileSync(envFile, "utf8").match(/^FLOWBOARD_HERMES_KEY=(.+)$/m)?.[1];
if (!key) throw new Error("Local AI key configuration is invalid.");
if (!fs.existsSync(path.join(home, "config.yaml"))) fs.writeFileSync(path.join(home, "config.yaml"), JSON.stringify({
  model: { provider: "custom", default: "qwen3.5:2b", ollama_num_ctx: 65536, base_url: "http://ollama:11434/v1", api_key: "local" },
  model_options: { reasoning: { enabled: false } },
  platform_toolsets: { api_server: ["no_mcp"], cli: ["no_mcp"] },
  agent: { max_turns: 2, disabled_toolsets: ["terminal", "file", "code_execution", "browser", "web", "memory", "session_search", "delegation", "cronjob", "skills", "todo", "kanban", "connections", "context_engine", "clarify", "computer_use", "vision", "video", "image_gen", "video_gen", "tts", "stt", "x_search", "homeassistant", "spotify", "discord", "discord_admin", "yuanbao"] },
  mcp_servers: {},
}, null, 2));
const compose = ["compose", "--env-file", envFile, "-f", path.join(root, "compose.ai.yaml")];
function docker(args, timeout = 600000) {
  const result = spawnSync("docker", args, { cwd: root, stdio: "inherit", timeout, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error("Docker could not finish AI setup. Start Docker Desktop, then run npm run ai:setup again. Existing model data is retained.");
}
async function main() {
  docker(["info", "--format", "{{.ServerVersion}}"], 20000);
  docker([...compose, "up", "-d"]);
  docker([...compose, "exec", "-T", "ollama", "ollama", "pull", "qwen3.5:2b"]);
  const toolsResponse = await fetch("http://127.0.0.1:8642/v1/toolsets", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
  const tools = await toolsResponse.json();
  if (!toolsResponse.ok || !Array.isArray(tools.data) || tools.data.some(tool => tool.enabled)) throw new Error("Hermes tools must be disabled before connecting it to Flowboard.");
  const response = await fetch("http://127.0.0.1:8642/v1/chat/completions", {
    method: "POST", signal: AbortSignal.timeout(180000), headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "hermes-agent", messages: [{ role: "user", content: "Reply with only: ready" }], stream: false, max_tokens: 20 }),
  });
  if (!response.ok || !(await response.json()).choices?.[0]?.message?.content) throw new Error("Hermes did not answer its readiness test. Check docker compose logs before enabling it.");
  const filename = path.join(root, "apps/web/.env.local");
  let environment = fs.existsSync(filename) ? fs.readFileSync(filename, "utf8") : "";
  const values = { HERMES_BASE_URL: "http://127.0.0.1:8642/v1", HERMES_API_KEY: key, AI_BASE_URL: "http://127.0.0.1:11434/v1", AI_MODEL: "qwen3.5:2b", AI_REASONING_EFFORT: "none", AI_API_KEY: "" };
  for (const [name, value] of Object.entries(values)) {
    const existing = environment.match(new RegExp(`^${name}=(.*)$`, "m"));
    if (existing?.[1]?.trim()) continue;
    environment = existing ? environment.replace(new RegExp(`^${name}=.*$`, "m"), `${name}=${value}`) : `${environment.trimEnd()}\n${name}=${value}\n`;
  }
  fs.writeFileSync(filename, environment, { mode: 0o600 });
  console.log("Hermes answered successfully. Local AI is configured; restart the development server. Vercel requires a separately hosted authenticated HTTPS endpoint.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
