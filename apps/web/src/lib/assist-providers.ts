export type AssistProvider = "auto" | "hermes" | "gemini" | "grok" | "deepseek" | "custom";
export function assistProviders() {
  return {
    hermes: { base: process.env.HERMES_BASE_URL, key: process.env.HERMES_API_KEY, model: process.env.HERMES_MODEL || "hermes-agent" },
    custom: { base: process.env.AI_BASE_URL, key: process.env.AI_API_KEY, model: process.env.AI_MODEL },
    gemini: { base: "https://generativelanguage.googleapis.com/v1beta/openai", key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || "gemini-3.8-flash" },
    grok: { base: "https://api.x.ai/v1", key: process.env.XAI_API_KEY, model: process.env.GROK_MODEL || "grok-4-1-fast-non-reasoning" },
    deepseek: { base: "https://api.deepseek.com", key: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL || "deepseek-chat" },
  };
}
export function configuredProviders() {
  return Object.fromEntries(Object.entries(assistProviders()).map(([name, value]) => [name, Boolean(value.base && value.model && (name === "custom" || value.key))]));
}
