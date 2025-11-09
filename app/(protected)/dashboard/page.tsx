'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomNav } from '@/components/bottom-nav';
import { AddLogSheet } from '@/components/add-log-sheet';
import { Dumbbell, Activity, UtensilsCrossed } from 'lucide-react';
import type { LogHistoryResponse } from '@/lib/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<LogHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/logs/history');
      if (response.ok) {
        const history: LogHistoryResponse = await response.json();
        setData(history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSuccess = () => {
    fetchHistory();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const aggregates = data?.todayAggregates || {
    calories_consumed: 0,
    protein_consumed: 0,
    carbs_consumed: 0,
    fat_consumed: 0,
    calories_burned: 0,
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <Dumbbell className="size-6" />
        <h1 className="text-2xl font-bold">HARVIS</h1>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Calories + Macros consumed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">
              {Math.round(aggregates.calories_consumed)} kcal
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>P: {Math.round(aggregates.protein_consumed)}g</div>
              <div>C: {Math.round(aggregates.carbs_consumed)}g</div>
              <div>F: {Math.round(aggregates.fat_consumed)}g</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Calories burnt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(aggregates.calories_burned)} kcal
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diet Logs */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
          <UtensilsCrossed className="size-5" />
          Diet Logs
        </h2>
        {data?.foodLogs && data.foodLogs.length > 0 ? (
          <div className="space-y-2">
            {data.foodLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        {log.raw_text || 'Food entry'}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {log.total_calories && (
                          <div>{Math.round(log.total_calories)} kcal</div>
                        )}
                        {(log.total_protein || log.total_carbs || log.total_fat) && (
                          <div>
                            P: {Math.round(log.total_protein || 0)}g | C:{' '}
                            {Math.round(log.total_carbs || 0)}g | F:{' '}
                            {Math.round(log.total_fat || 0)}g
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(log.logged_at), 'HH:mm')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              No diet logs yet
            </CardContent>
          </Card>
        )}
      </div>

      {/* Workout Logs */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Workout Logs</h2>
        {data?.workoutLogs && data.workoutLogs.length > 0 ? (
          <div className="space-y-2">
            {data.workoutLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      {log.workout_subtype === 'strength' ? (
                        <Dumbbell className="size-5 mt-0.5 text-primary" />
                      ) : (
                        <Activity className="size-5 mt-0.5 text-primary" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">
                          {log.activity || log.raw_text || 'Workout'}
                        </p>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {log.duration_minutes && (
                            <div>{Math.round(log.duration_minutes)} min</div>
                          )}
                          {log.calories_burned && (
                            <div>
                              {Math.round(log.calories_burned)} kcal burned
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(log.logged_at), 'HH:mm')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              No workout logs yet
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav onAddClick={() => setOpen(true)} />
      <AddLogSheet
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
