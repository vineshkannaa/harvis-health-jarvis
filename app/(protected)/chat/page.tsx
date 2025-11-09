'use client';

import { BottomNav } from '@/components/bottom-nav';
import { useState } from 'react';

export default function ChatPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen pb-20">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Chat with HARVIS</h1>
        <p className="text-muted-foreground text-center max-w-md">
          AI SDK integration coming soon. You&apos;ll be able to chat with HARVIS
          about your health data here.
        </p>
      </div>
      <BottomNav onAddClick={() => setOpen(true)} />
    </div>
  );
}

