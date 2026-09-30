"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error("Flowboard route error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950">
      <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <AlertTriangle className="mx-auto mb-4 size-10 text-amber-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">This workspace hit a problem</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Your board data is safe. Retry the request, or return to your boards if the problem continues.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => router.push("/")}>All boards</Button>
        </div>
      </section>
    </main>
  );
}
