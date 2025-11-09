'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import type { LogHistoryResponse } from '@/lib/types';

type DailyData = {
  date: string;
  calories_consumed: number;
  calories_burned: number;
  protein: number;
  carbs: number;
  fat: number;
  sleep_hours: number;
  net_calories: number;
};

export function Trends({ data }: { data: LogHistoryResponse | null }) {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);

  useEffect(() => {
    if (!data) return;

    // Group logs by date
    const grouped: Record<string, DailyData> = {};
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      grouped[dateStr] = {
        date: dateStr,
        calories_consumed: 0,
        calories_burned: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sleep_hours: 0,
        net_calories: 0,
      };
      return dateStr;
    });

    // Process food logs
    data.foodLogs.forEach((log) => {
      const dateStr = format(parseISO(log.logged_at), 'yyyy-MM-dd');
      if (grouped[dateStr]) {
        grouped[dateStr].calories_consumed += Number(log.total_calories || 0);
        grouped[dateStr].protein += Number(log.total_protein || 0);
        grouped[dateStr].carbs += Number(log.total_carbs || 0);
        grouped[dateStr].fat += Number(log.total_fat || 0);
      }
    });

    // Process workout logs
    data.workoutLogs.forEach((log) => {
      const dateStr = format(parseISO(log.logged_at), 'yyyy-MM-dd');
      if (grouped[dateStr]) {
        grouped[dateStr].calories_burned += Number(log.calories_burned || 0);
      }
    });

    // Process sleep logs
    data.sleepLogs.forEach((log) => {
      const dateStr = format(parseISO(log.logged_at), 'yyyy-MM-dd');
      if (grouped[dateStr]) {
        grouped[dateStr].sleep_hours += Number(log.sleep_hours || 0);
      }
    });

    // Calculate net calories and format dates
    const processed = last30Days
      .map((dateStr) => {
        const day = grouped[dateStr];
        if (!day) return null;
        day.net_calories = day.calories_consumed - day.calories_burned;
        day.date = format(parseISO(day.date), 'MMM d');
        return day;
      })
      .filter((day): day is DailyData => day !== null)
      .reverse(); // Show oldest to newest

    setDailyData(processed);
  }, [data]);

  const chartConfig = {
    calories_consumed: {
      label: 'Calories Consumed',
      color: 'hsl(var(--chart-1))',
    },
    calories_burned: {
      label: 'Calories Burned',
      color: 'hsl(var(--chart-2))',
    },
    net_calories: {
      label: 'Net Calories',
      color: 'hsl(var(--chart-3))',
    },
    protein: {
      label: 'Protein',
      color: 'hsl(var(--chart-1))',
    },
    carbs: {
      label: 'Carbs',
      color: 'hsl(var(--chart-2))',
    },
    fat: {
      label: 'Fat',
      color: 'hsl(var(--chart-3))',
    },
    sleep_hours: {
      label: 'Sleep Hours',
      color: 'hsl(var(--chart-4))',
    },
  };

  if (!data || dailyData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No data available for trends. Start logging to see your progress!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calories Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Calories Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="calories_consumed"
                stackId="1"
                stroke="var(--color-calories_consumed)"
                fill="var(--color-calories_consumed)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="calories_burned"
                stackId="2"
                stroke="var(--color-calories_burned)"
                fill="var(--color-calories_burned)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Net Calories */}
      <Card>
        <CardHeader>
          <CardTitle>Net Calories (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="net_calories"
                stroke="var(--color-net_calories)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Macros */}
      <Card>
        <CardHeader>
          <CardTitle>Macros Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="protein"
                stackId="macros"
                fill="var(--color-protein)"
              />
              <Bar
                dataKey="carbs"
                stackId="macros"
                fill="var(--color-carbs)"
              />
              <Bar dataKey="fat" stackId="macros" fill="var(--color-fat)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Sleep Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep Hours (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="sleep_hours"
                stroke="var(--color-sleep_hours)"
                fill="var(--color-sleep_hours)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

