// Types for HARVIS logging system

export type MealItem = {
  name: string;
  quantity?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type ParsedMeal = {
  mealName: string; // e.g., "Brunch", "Snack", "Dinner", "Night"
  summary: string; // LLM-generated concise summary
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

export type ParsedWorkout = {
  summary: string; // LLM-generated concise summary
  workoutSubtype: 'strength' | 'cardio';
  activity: string;
  durationMinutes: number;
  intensity: 'low' | 'moderate' | 'high';
  caloriesBurned: number;
};

export type ParsedSleep = {
  summary: string; // LLM-generated concise summary
  sleepHours: number;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
};

export type ParsedLogs = {
  rawText: string;
  meals: ParsedMeal[];
  workout?: ParsedWorkout;
  sleep?: ParsedSleep;
};

// Legacy type for backward compatibility (single log)
export type ParsedLog = {
  logType: 'food' | 'workout';
  rawText: string;
  items?: MealItem[];
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  workoutSubtype?: 'strength' | 'cardio';
  activity?: string;
  durationMinutes?: number;
  intensity?: 'low' | 'moderate' | 'high';
  caloriesBurned?: number;
};

export type IngestLogRequest = {
  text?: string;
  audioBase64?: string;
  mime?: string;
};

export type IngestLogResponse = {
  success: boolean;
  logIds?: string[]; // Array of created log IDs
  mealsCreated?: number;
  workoutCreated?: boolean;
  sleepCreated?: boolean;
  parsed?: ParsedLogs;
  error?: string;
};

export type LogHistoryResponse = {
  foodLogs: Array<{
    id: string;
    logged_at: string;
    raw_text: string | null;
    total_calories: number | null;
    total_protein: number | null;
    total_carbs: number | null;
    total_fat: number | null;
    items: any;
  }>;
  workoutLogs: Array<{
    id: string;
    logged_at: string;
    raw_text: string | null;
    workout_subtype: 'strength' | 'cardio' | null;
    activity: string | null;
    duration_minutes: number | null;
    calories_burned: number | null;
  }>;
  sleepLogs: Array<{
    id: string;
    logged_at: string;
    raw_text: string | null;
    sleep_hours: number | null;
  }>;
  todayAggregates: {
    calories_consumed: number;
    protein_consumed: number;
    carbs_consumed: number;
    fat_consumed: number;
    calories_burned: number;
    sleep_hours: number;
  };
};

