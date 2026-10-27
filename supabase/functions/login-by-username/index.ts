// Supabase Edge Function: secure username -> verified email lookup, then standard Auth password sign-in.
// Deploy with: supabase functions deploy login-by-username
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const { username, password } = await req.json();
    const clean = String(username ?? '').trim().replace(/^@/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(clean) || typeof password !== 'string' || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Usuario o contraseña no válidos.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: lookupError } = await admin.from('profiles').select('id').eq('username', clean).maybeSingle();
    if (lookupError || !profile) return new Response(JSON.stringify({ error: 'Usuario o contraseña no válidos.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: authUser, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError || !authUser.user?.email || !authUser.user.email_confirmed_at) return new Response(JSON.stringify({ error: 'Debes verificar tu correo antes de iniciar sesión.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const publicClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await publicClient.auth.signInWithPassword({ email: authUser.user.email, password });
    if (error || !data.session) return new Response(JSON.stringify({ error: 'Usuario o contraseña no válidos.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo completar el inicio de sesión.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
