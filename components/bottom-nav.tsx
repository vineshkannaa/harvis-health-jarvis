'use client';

import Link from 'next/link';
import { Home, Plus, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function BottomNav({
  onAddClick,
}: {
  onAddClick: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-around px-4 safe-area-inset-bottom">
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-colors',
            pathname === '/dashboard'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Home className="size-5" />
          <span className="text-xs font-medium">Home</span>
        </Link>

        <button
          onClick={onAddClick}
          className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Add log"
        >
          <Plus className="size-6" />
        </button>

        <Link
          href="/chat"
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-colors',
            pathname === '/chat'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MessageSquare className="size-5" />
          <span className="text-xs font-medium">Chat</span>
        </Link>
      </div>
    </nav>
  );
}

