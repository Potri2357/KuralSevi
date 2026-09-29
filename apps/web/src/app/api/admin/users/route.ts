import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

type UserRole = 'admin' | 'district_officer' | 'panchayat_kiosk';

// List all users (admin only)
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service role to list all profiles
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await service
    .from('user_profiles')
    .select('id, full_name, role, district, panchayat, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

// Create a new user with role (admin only)
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, full_name, role, district, panchayat } = body as {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    district?: string;
    panchayat?: string;
  };

  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create auth user
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'User creation failed' }, { status: 500 });
  }

  // Upsert profile (trigger should auto-create, but be safe)
  const { error: profileError } = await service
    .from('user_profiles')
    .upsert({
      id: authData.user.id,
      full_name,
      role,
      district: district || null,
      panchayat: panchayat || null,
      is_active: true,
    });

  if (profileError) {
    return NextResponse.json({ error: profileError.message, userId: authData.user.id }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: authData.user.id });
}

// Update user role / status (admin only)
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role, is_active, district, panchayat } = body;

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;
  if (district !== undefined) updates.district = district;
  if (panchayat !== undefined) updates.panchayat = panchayat;

  const { error } = await service
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
