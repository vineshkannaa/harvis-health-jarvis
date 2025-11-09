import { createClient } from '@/lib/supabase/server';
import type { LogHistoryResponse } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Fetch recent logs
    const { data: logs, error: logsError } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (logsError) {
      return NextResponse.json(
        { error: logsError.message },
        { status: 500 }
      );
    }

    // Separate food, workout, and sleep logs
    const foodLogs = logs
      .filter((log) => log.log_type === 'food')
      .map((log) => ({
        id: log.id,
        logged_at: log.logged_at,
        raw_text: log.raw_text,
        total_calories: log.total_calories,
        total_protein: log.total_protein,
        total_carbs: log.total_carbs,
        total_fat: log.total_fat,
        items: log.items,
      }));

    const workoutLogs = logs
      .filter((log) => log.log_type === 'workout')
      .map((log) => ({
        id: log.id,
        logged_at: log.logged_at,
        raw_text: log.raw_text,
        workout_subtype: log.workout_subtype,
        activity: log.activity,
        duration_minutes: log.duration_minutes,
        calories_burned: log.calories_burned,
      }));

    const sleepLogs = logs
      .filter((log) => log.log_type === 'sleep')
      .map((log) => ({
        id: log.id,
        logged_at: log.logged_at,
        raw_text: log.raw_text,
        sleep_hours: log.sleep_hours,
      }));

    // Calculate today's aggregates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: todayLogs, error: todayError } = await supabase
      .from('logs')
      .select('log_type, total_calories, total_protein, total_carbs, total_fat, calories_burned, sleep_hours')
      .eq('user_id', user.id)
      .gte('logged_at', todayISO);

    if (todayError) {
      return NextResponse.json(
        { error: todayError.message },
        { status: 500 }
      );
    }

    const aggregates = {
      calories_consumed: 0,
      protein_consumed: 0,
      carbs_consumed: 0,
      fat_consumed: 0,
      calories_burned: 0,
      sleep_hours: 0,
    };

    todayLogs?.forEach((log) => {
      if (log.log_type === 'food') {
        aggregates.calories_consumed += Number(log.total_calories || 0);
        aggregates.protein_consumed += Number(log.total_protein || 0);
        aggregates.carbs_consumed += Number(log.total_carbs || 0);
        aggregates.fat_consumed += Number(log.total_fat || 0);
      } else if (log.log_type === 'workout') {
        aggregates.calories_burned += Number(log.calories_burned || 0);
      } else if (log.log_type === 'sleep') {
        aggregates.sleep_hours += Number(log.sleep_hours || 0);
      }
    });

    const response: LogHistoryResponse = {
      foodLogs,
      workoutLogs,
      sleepLogs,
      todayAggregates: aggregates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

