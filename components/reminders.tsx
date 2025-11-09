'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';

type Reminder = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'harvis_reminders';

export type RemindersRef = {
  addReminder: (text: string) => void;
};

export const Reminders = forwardRef<RemindersRef>((props, ref) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Load reminders from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        setReminders(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  }, []);

  // Save reminders to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  }, [reminders]);

  const addReminder = (text: string) => {
    if (!text.trim()) return;

    const newReminder: Reminder = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    setReminders((prev) => [newReminder, ...prev]);
  };

  // Expose addReminder via ref
  useImperativeHandle(ref, () => ({
    addReminder,
  }));

  const toggleReminder = (id: string) => {
    setReminders(
      reminders.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      )
    );
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const activeReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">General Reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active reminders */}
        {activeReminders.length > 0 && (
          <div className="space-y-2">
            {activeReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="group flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={reminder.completed}
                  onCheckedChange={() => toggleReminder(reminder.id)}
                />
                <span className="flex-1 text-sm">{reminder.text}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteReminder(reminder.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Completed reminders (collapsed by default) */}
        {completedReminders.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              {completedReminders.length} completed
            </summary>
            <div className="mt-2 space-y-2">
              {completedReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-2 p-2 rounded-md opacity-60"
                >
                  <Checkbox
                    checked={reminder.completed}
                    onCheckedChange={() => toggleReminder(reminder.id)}
                  />
                  <span className="flex-1 text-sm line-through">
                    {reminder.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteReminder(reminder.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </details>
        )}

        {reminders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No reminders yet. Use the + button to add one!
          </p>
        )}
      </CardContent>
    </Card>
  );
});

Reminders.displayName = 'Reminders';

