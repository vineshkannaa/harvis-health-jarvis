import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10 h-16">
        <div className="mx-auto max-w-5xl h-full flex items-center justify-between px-5">
          <div className="flex items-center gap-2 font-semibold">
            <Link href={"/"} className="text-base md:text-lg">
              HARVIS
            </Link>
            <span className="hidden sm:inline text-muted-foreground text-xs md:text-sm">
              Health‑JARVIS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <AuthButton />
          </div>
        </div>
      </nav>

      <section className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Track food and workouts with text or voice
            </h1>
            <p className="mt-4 text-muted-foreground text-sm md:text-base">
              HARVIS computes calories, macros, and burned energy—organized in a
              simple, mobile‑first dashboard.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90"
              >
                Open Dashboard
              </Link>
              <Link
                href="/auth/login"
                className="rounded-md border px-5 py-2.5 text-sm hover:bg-accent"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-5">
              <h3 className="text-sm font-semibold mb-1">Unified logging</h3>
              <p className="text-sm text-muted-foreground">
                Add entries via text or voice. HARVIS classifies as food or
                workout automatically.
              </p>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="text-sm font-semibold mb-1">Macros & calories</h3>
              <p className="text-sm text-muted-foreground">
                Get best‑effort macro estimates for meals and calories burned
                for workouts.
              </p>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="text-sm font-semibold mb-1">Mobile‑first</h3>
              <p className="text-sm text-muted-foreground">
                Clean UI designed for fast logging and quick daily summaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full border-t">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-xs text-muted-foreground">
          <p>
            Built with Next.js and Supabase · <span>HARVIS</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
