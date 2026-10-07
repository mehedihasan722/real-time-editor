"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
export function TurnstileVerification({ onToken }: { onToken: (token: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => { callback.current = onToken; }, [onToken]);
  const loaded = useCallback(() => setReady(true), []);
  useEffect(() => {
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!ready || !host.current || !api) return;
    const id = api.render(host.current, { sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, action: "workspace-services", size: "flexible", callback: (token: string) => callback.current(token), "expired-callback": () => callback.current(""), "error-callback": () => { callback.current(""); setError(true); } });
    return () => { api.remove(id); callback.current(""); };
  }, [ready]);
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return <p role="alert">Verification is unavailable. Ask your administrator to configure it.</p>;
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={loaded} onError={() => setError(true)} /><div ref={host} />{error && <p role="alert" className="text-sm">Verification could not load. Reopen this dialog to retry.</p>}</>;
}
