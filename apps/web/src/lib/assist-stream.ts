// OpenAI-compatible SSE decoder. Handles split UTF-8 characters and split frames.
export async function consumeAssistStream(response: Response, onText: (text: string) => void, signal?: AbortSignal) {
  if (!response.body) throw new Error("The assistant returned no response.");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  const cancel = () => { void reader.cancel(signal?.reason).catch(() => {}); };
  signal?.addEventListener("abort", cancel, { once: true });
  let pending = "", text = "", bytes = 0;
  try {
    while (true) {
      signal?.throwIfAborted();
      const { value, done } = await reader.read();
      signal?.throwIfAborted();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1_000_000) throw new Error("The assistant response exceeded the limit.");
      pending = (pending + decoder.decode(value, { stream: true })).replace(/\r\n/g, "\n");
      let boundary: number;
      while ((boundary = pending.indexOf("\n\n")) !== -1) {
        const frame = pending.slice(0, boundary); pending = pending.slice(boundary + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") { if (!text.trim()) throw new Error("The assistant returned an empty response."); return text; }
          const event = JSON.parse(data);
          if (event.error) throw new Error("The assistant could not finish. Try again.");
          const delta = event.choices?.[0]?.delta?.content;
          if (typeof delta === "string") { text += delta; if (text.length > 50000) throw new Error("The assistant response exceeded the limit."); onText(text); }
        }
      }
    }
    throw new Error("The assistant connection ended before the response finished. Try again.");
  } finally { signal?.removeEventListener("abort", cancel); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
