import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import {
  getProvisionedUsers,
  saveProvisionedUser,
  updateProvisionedUser,
  type UserRole,
  type ProvisionedUser,
} from '@/lib/user-store';
import { createNodeFetch } from '@/lib/node-fetch-adapter';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://iuedutlxbqdgeniiggvu.supabase.co';

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_egP8KJhgDC6SoW4uqLzBeA_LpHeH7bF';

const serverFetch = createNodeFetch() as typeof fetch;

// Verify if caller has Admin authority
async function verifyAdminCaller(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const fastRole = cookieStore.get('ks_role')?.value;
  if (fastRole === 'admin') return true;

  try {
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const directClient = createServiceClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { fetch: serverFetch },
      auth: { persistSession: false },
    });

    const { data: profile } = await directClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin';
  } catch {
    return false;
  }
}

// 1. List all users (admin only)
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminCaller(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // Get local provisioned users
  const provisioned = getProvisionedUsers().map((u) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    district: u.district,
    panchayat: u.panchayat,
    is_active: u.is_active,
    created_at: u.created_at,
  }));

  // Also query Supabase user_profiles if available
  try {
    const service = createServiceClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { fetch: serverFetch },
      auth: { persistSession: false },
    });

    const { data: dbProfiles } = await service
      .from('user_profiles')
      .select('id, full_name, role, district, panchayat, is_active, created_at')
      .order('created_at', { ascending: false });

    if (dbProfiles && dbProfiles.length > 0) {
      // Merge unique by ID
      const seenIds = new Set(provisioned.map((u) => u.id));
      for (const p of dbProfiles) {
        if (!seenIds.has(p.id)) {
          provisioned.push({
            id: p.id,
            full_name: p.full_name,
            email: `${p.role}@kuralsevi.gov.in`,
            role: p.role,
            district: p.district,
            panchayat: p.panchayat,
            is_active: p.is_active,
            created_at: p.created_at,
          });
        }
      }
    }
  } catch (e) {
    console.error('Error fetching dbProfiles:', e);
  }

  return NextResponse.json({ users: provisioned });
}

// 2. Create a new user with role (admin only)
export async function POST(request: NextRequest) {
  const isAuthorized = await verifyAdminCaller(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, full_name, role, district, panchayat } = body as {
    email?: string;
    password?: string;
    full_name?: string;
    role?: UserRole;
    district?: string;
    panchayat?: string;
  };

  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'Email, password, full name, and role are required.' }, { status: 400 });
  }

  const userId = crypto.randomUUID();

  // Persist into user-store so it reflects instantly across Officer and Kiosk logins
  const newUser: ProvisionedUser = {
    id: userId,
    email: email.trim(),
    password,
    full_name: full_name.trim(),
    role,
    district: district?.trim() || null,
    panchayat: panchayat?.trim() || null,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  saveProvisionedUser(newUser);

  // Background sync to Supabase with safety timeout
  Promise.race([
    (async () => {
      try {
        const service = createServiceClient(SUPABASE_URL, SUPABASE_KEY, {
          global: { fetch: serverFetch },
          auth: { persistSession: false },
        });

        await service.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name,
              role,
              district: district || null,
              panchayat: panchayat || null,
            },
          },
        });

        await service.from('user_profiles').upsert({
          id: userId,
          full_name,
          role,
          district: district || null,
          panchayat: panchayat || null,
          is_active: true,
        });
      } catch (e) {
        console.error('Supabase user creation sync log:', e);
      }
    })(),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]).catch(() => {});

  return NextResponse.json({
    success: true,
    message: `Account created for ${full_name} (${role})`,
    user: {
      id: userId,
      full_name: newUser.full_name,
      email: newUser.email,
      role: newUser.role,
      district: newUser.district,
      panchayat: newUser.panchayat,
      is_active: true,
    },
  });
}

// 3. Update user role / status / location (admin only)
export async function PATCH(request: NextRequest) {
  const isAuthorized = await verifyAdminCaller(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { id, role, is_active, district, panchayat } = body as {
    id?: string;
    role?: UserRole;
    is_active?: boolean;
    district?: string;
    panchayat?: string;
  };

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const updates: Partial<Omit<ProvisionedUser, 'id' | 'created_at'>> = {};
  if (role !== undefined) updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;
  if (district !== undefined) updates.district = district;
  if (panchayat !== undefined) updates.panchayat = panchayat;

  // Update in persistent store immediately
  updateProvisionedUser(id, updates);

  // Background sync to Supabase with safety timeout
  Promise.race([
    (async () => {
      try {
        const service = createServiceClient(SUPABASE_URL, SUPABASE_KEY, {
          global: { fetch: serverFetch },
          auth: { persistSession: false },
        });

        await service.from('user_profiles').update(updates).eq('id', id);
      } catch (e) {
        console.error('Supabase user_profiles update sync log:', e);
      }
    })(),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]).catch(() => {});

  return NextResponse.json({ success: true, message: 'User updated successfully' });
}

