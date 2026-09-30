import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950">
      <section className="text-center">
        <p className="text-sm font-black tracking-[0.25em] text-indigo-600">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Board not found</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">The board may have been removed or the link may be incomplete.</p>
        <Button asChild className="mt-6"><Link href="/">Return to boards</Link></Button>
      </section>
    </main>
  );
}
