import { createClient } from "@/lib/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get user data (middleware already verified authentication)
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return (
    <main className="flex flex-col">
      <nav className="w-full border-b border-b-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4 px-6">
          <div className="flex gap-6 items-center">
            <Link href="/dashboard" className="font-bold text-lg hover:opacity-80 transition-opacity">
              Dashboard
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-accent">
                <span className="text-muted-foreground">Signed in as:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="sm:hidden flex items-center gap-2">
                <span className="font-medium">{user?.email}</span>
              </div>
            </div>
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full pt-6 px-4 pb-8 md:px-32">
        {children}
      </div>
    </main>
  );
}
