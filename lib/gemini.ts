import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedLog, ParsedLogs } from './types';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM_INSTRUCTION = `You are a health logging assistant. Parse user input to extract BOTH diet and workout information separately.

CRITICAL: The input may contain meals, workout, AND sleep information. You MUST separate them:
1. Extract ALL meals mentioned (brunch, lunch, dinner, snack, breakfast, etc.)
2. Extract workout information if present
3. Extract sleep information if present (hours slept, sleep quality)
4. Create separate entries for each meal
5. Create one workout entry if workout is mentioned
6. Create one sleep entry if sleep is mentioned

For MEALS:
- Group food items by meal time/name (brunch, lunch, dinner, snack, breakfast, night, etc.)
- For EACH meal, create a separate entry with:
  - mealName: The meal identifier (e.g., "Brunch", "Dinner", "Snack")
  - summary: A concise 1-sentence summary of what was eaten (e.g., "Paneer rice bowl with vegetables")
  - items: Array of individual food items with estimated macros
  - Calculate totals for that specific meal
- Estimate macros for each item using reasonable values
- Examples:
  - "paneer rice bowl" → paneer (150g: 20g protein, 250 cal) + rice (100g: 200 cal, 40g carbs)
  - "whey shake" → 1 scoop (25g protein, 120 cal, 3g carbs)
  - "fish curry + 2 chapati" → fish (150g: 30g protein, 200 cal) + chapati x2 (300 cal, 60g carbs)

For WORKOUT:
- Extract workout information if present
- Create ONE workout entry with:
  - summary: A concise 1-sentence summary (e.g., "Push day: bench press, incline press, tricep pushdowns")
  - workoutSubtype: "strength" or "cardio"
  - activity: Combined description of all exercises
  - durationMinutes: Total estimated duration
  - intensity: "low", "moderate", or "high"
  - caloriesBurned: Estimated based on MET values
- Example: "bench 5×5 @ 80kg, incline 4×8, tricep pushdowns 4×10" → 
  summary: "Push day: bench press, incline press, tricep pushdowns"
  duration: 60 min, intensity: "moderate", caloriesBurned: 450

For SLEEP:
- Extract sleep information if present
- Create ONE sleep entry with:
  - summary: A concise 1-sentence summary (e.g., "Slept 7 hours, good quality")
  - sleepHours: Number of hours slept (decimal allowed, e.g., 7.5)
  - quality: Optional - "poor", "fair", "good", or "excellent" based on user description
- Examples:
  - "slept 6 hours" → sleepHours: 6
  - "slept 6h 30mins" or "slept 6 hours 30 minutes" → sleepHours: 6.5
  - "slept 7.5 hours, felt rested" → sleepHours: 7.5, quality: "good"
  - "only got 5 hours, tired" → sleepHours: 5, quality: "poor"
  - "slept for 6h 30mins" → sleepHours: 6.5
  - "got 8 hours of sleep" → sleepHours: 8
- IMPORTANT: Convert time formats like "6h 30mins", "6 hours 30 minutes", "6:30" to decimal hours (6.5)

Return ONLY valid JSON matching this schema:
{
  "rawText": "original input",
  "meals": [
    {
      "mealName": "Brunch",
      "summary": "Concise 1-sentence summary",
      "items": [{"name": "...", "quantity": "...", "calories": ..., "protein": ..., "carbs": ..., "fat": ...}],
      "totalCalories": ...,
      "totalProtein": ...,
      "totalCarbs": ...,
      "totalFat": ...
    }
  ],
  "workout": {
    "summary": "Concise 1-sentence summary",
    "workoutSubtype": "strength" | "cardio",
    "activity": "...",
    "durationMinutes": ...,
    "intensity": "low" | "moderate" | "high",
    "caloriesBurned": ...
  },
  "sleep": {
    "summary": "Concise 1-sentence summary",
    "sleepHours": ...,
    "quality": "poor" | "fair" | "good" | "excellent" (optional)
  }
}

IMPORTANT:
- "meals" is ALWAYS an array (even if empty)
- "workout" is optional (only include if workout info is present)
- "sleep" is optional (only include if sleep info is present)
- Each meal gets its own entry
- Create summaries that are clear and concise

Do not include any commentary or markdown formatting. Return only the JSON object.`;

export async function parseLogsWithGemini(
  input: string | { audioBase64: string; mime: string }
): Promise<ParsedLogs> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  let contents: any[];

  if (typeof input === 'string') {
    // Text input
    contents = [
      {
        role: 'user',
        parts: [{ text: input }],
      },
    ];
  } else {
    // Audio input (multimodal)
    contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: input.mime || 'audio/webm',
              data: input.audioBase64,
            },
          },
          {
            text: 'Transcribe this audio and parse it as a health log (food or workout).',
          },
        ],
      },
    ];
  }

  console.log('[Gemini] Starting parse with input type:', typeof input === 'string' ? 'text' : 'audio');
  if (typeof input === 'string') {
    console.log('[Gemini] Input text (first 200 chars):', input.substring(0, 200));
  }

  const result = await model.generateContent({
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const responseText = result.response.text();
  console.log('[Gemini] Raw response:', responseText.substring(0, 500));
  
  // Clean up any markdown code blocks if present
  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  let parsed: ParsedLogs;
  try {
    parsed = JSON.parse(cleaned);
    console.log('[Gemini] Parsed successfully:', {
      mealsCount: parsed.meals?.length || 0,
      hasWorkout: !!parsed.workout,
      mealNames: parsed.meals?.map(m => m.mealName) || [],
    });
  } catch (parseError) {
    console.error('[Gemini] JSON parse error:', parseError);
    console.error('[Gemini] Cleaned text:', cleaned);
    throw new Error(`Failed to parse Gemini response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
  
  return parsed;
}

// Legacy function for backward compatibility
export async function parseLogWithGemini(
  input: string | { audioBase64: string; mime: string }
): Promise<ParsedLog> {
  const parsed = await parseLogsWithGemini(input);
  
  // Convert to legacy format (use first meal or workout)
  if (parsed.meals && parsed.meals.length > 0) {
    const firstMeal = parsed.meals[0];
    return {
      logType: 'food',
      rawText: parsed.rawText,
      items: firstMeal.items,
      totalCalories: firstMeal.totalCalories,
      totalProtein: firstMeal.totalProtein,
      totalCarbs: firstMeal.totalCarbs,
      totalFat: firstMeal.totalFat,
    };
  } else if (parsed.workout) {
    return {
      logType: 'workout',
      rawText: parsed.rawText,
      workoutSubtype: parsed.workout.workoutSubtype,
      activity: parsed.workout.activity,
      durationMinutes: parsed.workout.durationMinutes,
      intensity: parsed.workout.intensity,
      caloriesBurned: parsed.workout.caloriesBurned,
    };
  } else {
    throw new Error('No meals or workout found in parsed data');
  }
}

