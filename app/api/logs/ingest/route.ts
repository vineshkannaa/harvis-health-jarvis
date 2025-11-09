import { createClient } from '@/lib/supabase/server';
import { parseLogsWithGemini } from '@/lib/gemini';
import type { IngestLogRequest, IngestLogResponse } from '@/lib/types';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';

type LogInsert = Database['public']['Tables']['logs']['Insert'];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as IngestLogResponse,
        { status: 401 }
      );
    }

    const body: IngestLogRequest = await request.json();
    console.log('[Ingest] Request received:', {
      hasText: !!body.text,
      hasAudio: !!body.audioBase64,
      textPreview: body.text?.substring(0, 100),
    });
    
    if (!body.text && !body.audioBase64) {
      return NextResponse.json(
        { success: false, error: 'Either text or audioBase64 is required' } as IngestLogResponse,
        { status: 400 }
      );
    }

    // Parse with Gemini
    let parsed;
    try {
      if (body.audioBase64) {
        console.log('[Ingest] Processing audio input');
        parsed = await parseLogsWithGemini({
          audioBase64: body.audioBase64,
          mime: body.mime || 'audio/webm',
        });
      } else {
        console.log('[Ingest] Processing text input');
        parsed = await parseLogsWithGemini(body.text!);
      }
      console.log('[Ingest] Gemini parsing completed:', {
        mealsCount: parsed.meals?.length || 0,
        hasWorkout: !!parsed.workout,
      });
    } catch (parseError) {
      console.error('[Ingest] Gemini parsing failed:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to parse input: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        } as IngestLogResponse,
        { status: 500 }
      );
    }

    // Validate that we have at least meals or workout
    if ((!parsed.meals || parsed.meals.length === 0) && !parsed.workout) {
      console.error('[Ingest] No meals or workout found in parsed data');
      return NextResponse.json(
        {
          success: false,
          error: 'Could not extract any meals or workout from input. Please try rephrasing.',
        } as IngestLogResponse,
        { status: 422 }
      );
    }

    const logIds: string[] = [];
    const loggedAt = new Date().toISOString();

    // Create separate log entries for each meal
    if (parsed.meals && parsed.meals.length > 0) {
      console.log(`[Ingest] Creating ${parsed.meals.length} meal log(s)`);
      
      for (const meal of parsed.meals) {
        const mealInsert: LogInsert = {
          user_id: user.id,
          log_type: 'food',
          raw_text: meal.summary, // Use LLM summary instead of raw text
          source: body.audioBase64 ? 'voice' : 'text',
          logged_at: loggedAt,
          total_calories: meal.totalCalories,
          total_protein: meal.totalProtein,
          total_carbs: meal.totalCarbs,
          total_fat: meal.totalFat,
          items: meal.items ? JSON.parse(JSON.stringify(meal.items)) : null,
        };

        console.log(`[Ingest] Inserting meal: ${meal.mealName}`, {
          calories: mealInsert.total_calories,
          protein: mealInsert.total_protein,
        });

        const { data: mealData, error: mealError } = await supabase
          .from('logs')
          .insert(mealInsert)
          .select()
          .single();

        if (mealError) {
          console.error(`[Ingest] Failed to insert meal ${meal.mealName}:`, mealError);
          // Continue with other meals even if one fails
        } else {
          logIds.push(mealData.id);
          console.log(`[Ingest] Successfully saved meal log: ${mealData.id}`);
        }
      }
    }

    // Create workout log entry if present
    if (parsed.workout) {
      console.log('[Ingest] Creating workout log');
      
      const workoutInsert: LogInsert = {
        user_id: user.id,
        log_type: 'workout',
        raw_text: parsed.workout.summary, // Use LLM summary
        source: body.audioBase64 ? 'voice' : 'text',
        logged_at: loggedAt,
        workout_subtype: parsed.workout.workoutSubtype,
        activity: parsed.workout.activity,
        duration_minutes: parsed.workout.durationMinutes,
        intensity: parsed.workout.intensity,
        calories_burned: parsed.workout.caloriesBurned,
      };

      console.log('[Ingest] Inserting workout:', {
        subtype: workoutInsert.workout_subtype,
        activity: workoutInsert.activity,
        caloriesBurned: workoutInsert.calories_burned,
      });

      const { data: workoutData, error: workoutError } = await supabase
        .from('logs')
        .insert(workoutInsert)
        .select()
        .single();

      if (workoutError) {
        console.error('[Ingest] Failed to insert workout:', workoutError);
      } else {
        logIds.push(workoutData.id);
        console.log('[Ingest] Successfully saved workout log:', workoutData.id);
      }
    }

    if (logIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create any log entries. Please check the input format.',
        } as IngestLogResponse,
        { status: 500 }
      );
    }

    console.log('[Ingest] Successfully created logs:', logIds);
    return NextResponse.json({
      success: true,
      logIds,
      mealsCreated: parsed.meals?.length || 0,
      workoutCreated: !!parsed.workout,
      parsed,
    } as IngestLogResponse);
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as IngestLogResponse,
      { status: 500 }
    );
  }
}

