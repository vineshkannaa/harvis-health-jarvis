import { streamText, convertToModelMessages, type CoreMessage } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { google } from '@ai-sdk/google';
import type { LogHistoryResponse } from '@/lib/types';
import { format } from 'date-fns';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

function buildSystemPrompt(history: LogHistoryResponse): string {
  const { foodLogs, workoutLogs, todayAggregates } = history;
  
  let prompt = `You are HARVIS (Health-JARVIS), a friendly and knowledgeable AI health assistant. You help users track and understand their diet, workouts, and overall health.

USER'S HEALTH DATA SUMMARY:

Today's Totals:
- Calories Consumed: ${Math.round(todayAggregates.calories_consumed)} kcal
- Protein: ${Math.round(todayAggregates.protein_consumed)}g
- Carbs: ${Math.round(todayAggregates.carbs_consumed)}g
- Fat: ${Math.round(todayAggregates.fat_consumed)}g
- Calories Burned: ${Math.round(todayAggregates.calories_burned)} kcal
- Net Calories: ${Math.round(todayAggregates.calories_consumed - todayAggregates.calories_burned)} kcal

Recent Diet Logs (${foodLogs.length} entries):\n`;

  if (foodLogs.length > 0) {
    foodLogs.slice(0, 20).forEach((log, idx) => {
      const time = format(new Date(log.logged_at), 'MMM d, HH:mm');
      prompt += `${idx + 1}. [${time}] ${log.raw_text || 'Food entry'}\n`;
      if (log.total_calories) {
        prompt += `   - ${Math.round(log.total_calories)} kcal | P: ${Math.round(log.total_protein || 0)}g | C: ${Math.round(log.total_carbs || 0)}g | F: ${Math.round(log.total_fat || 0)}g\n`;
      }
      if (log.items && Array.isArray(log.items) && log.items.length > 0) {
        prompt += `   - Items: ${log.items.map((item: any) => item.name || 'item').join(', ')}\n`;
      }
    });
  } else {
    prompt += 'No diet logs yet.\n';
  }

  prompt += `\nRecent Workout Logs (${workoutLogs.length} entries):\n`;

  if (workoutLogs.length > 0) {
    workoutLogs.slice(0, 20).forEach((log, idx) => {
      const time = format(new Date(log.logged_at), 'MMM d, HH:mm');
      prompt += `${idx + 1}. [${time}] ${log.raw_text || log.activity || 'Workout'}\n`;
      if (log.workout_subtype) {
        prompt += `   - Type: ${log.workout_subtype}\n`;
      }
      if (log.activity) {
        prompt += `   - Activity: ${log.activity}\n`;
      }
      if (log.duration_minutes) {
        prompt += `   - Duration: ${Math.round(log.duration_minutes)} min\n`;
      }
      if (log.calories_burned) {
        prompt += `   - Calories Burned: ${Math.round(log.calories_burned)} kcal\n`;
      }
    });
  } else {
    prompt += 'No workout logs yet.\n';
  }

  prompt += `\nINSTRUCTIONS:
- Answer questions about the user's health data, diet, and workouts
- Provide insights, trends, and recommendations based on their data
- Be friendly, encouraging, and supportive
- If asked about trends, analyze the data provided
- If asked about recommendations, provide actionable advice
- Always reference specific data when making observations
- Help users understand their calorie balance, macro distribution, and workout patterns`;

  return prompt;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

    // Fetch user's health data directly from Supabase
    const { data: logs, error: logsError } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(50);

    if (logsError) {
      console.error('[Chat] Failed to fetch user logs:', logsError);
    }

    let systemPrompt = 'You are HARVIS (Health-JARVIS), a friendly AI health assistant.';
    
    if (logs && logs.length > 0) {
      // Build history response from logs
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

      // Calculate today's aggregates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const todayLogs = logs.filter((log) => log.logged_at >= todayISO);
      const aggregates = {
        calories_consumed: 0,
        protein_consumed: 0,
        carbs_consumed: 0,
        fat_consumed: 0,
        calories_burned: 0,
      };

      todayLogs.forEach((log) => {
        if (log.log_type === 'food') {
          aggregates.calories_consumed += Number(log.total_calories || 0);
          aggregates.protein_consumed += Number(log.total_protein || 0);
          aggregates.carbs_consumed += Number(log.total_carbs || 0);
          aggregates.fat_consumed += Number(log.total_fat || 0);
        } else if (log.log_type === 'workout') {
          aggregates.calories_burned += Number(log.calories_burned || 0);
        }
      });

      const history: LogHistoryResponse = {
        foodLogs,
        workoutLogs,
        todayAggregates: aggregates,
      };

      systemPrompt = buildSystemPrompt(history);
    }

    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      messages: convertToModelMessages(messages),
      system: systemPrompt,
      temperature: 0.7,
    });

    // Return streaming response for useChat hook
    // useChat expects UIMessage stream format
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[Chat] Error:', error);
    return new Response(
      error instanceof Error ? error.message : 'Unknown error',
      { status: 500 }
    );
  }
}

