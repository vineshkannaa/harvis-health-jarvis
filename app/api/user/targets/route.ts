import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';

type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: profile || null,
    });
  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { target_calories_consumed, target_calories_burned, setup_completed } = body;

    // Upsert profile with proper typing
    const profileInsert: UserProfileInsert = {
      id: user.id,
      target_calories_consumed: target_calories_consumed ?? null,
      target_calories_burned: target_calories_burned ?? null,
      setup_completed: setup_completed ?? false,
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert(profileInsert)
      .select()
      .single();

    if (error) {
      console.error('Error saving targets:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Error saving targets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

