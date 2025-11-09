'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function TargetSetup({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const [caloriesConsumed, setCaloriesConsumed] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const consumed = parseFloat(caloriesConsumed);
    const burned = parseFloat(caloriesBurned);

    if (!consumed || consumed <= 0 || !burned || burned <= 0) {
      alert('Please enter valid calorie targets (greater than 0)');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_calories_consumed: consumed,
          target_calories_burned: burned,
          setup_completed: true,
        }),
      });

      if (response.ok) {
        onComplete();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save targets');
      }
    } catch (error) {
      console.error('Error saving targets:', error);
      alert('Failed to save targets. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Welcome to HARVIS!</DialogTitle>
          <DialogDescription>
            Set your daily calorie targets to get started
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="consumed">Target Calories Consumed (kcal/day)</Label>
            <Input
              id="consumed"
              type="number"
              placeholder="e.g., 2000"
              value={caloriesConsumed}
              onChange={(e) => setCaloriesConsumed(e.target.value)}
              min="1"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="burned">Target Calories Burned (kcal/day)</Label>
            <Input
              id="burned"
              type="number"
              placeholder="e.g., 500"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
              min="1"
              disabled={isSaving}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!caloriesConsumed || !caloriesBurned || isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Targets'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

