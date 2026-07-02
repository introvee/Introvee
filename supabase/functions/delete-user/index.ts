import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the session or user object
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ message: 'User already deleted or signed out' }, 200);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await deleteUserData(supabaseAdmin, user.id);
    await deleteProfileImages(supabaseAdmin, user.id);

    // Delete the user using the admin API
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      if (isAlreadyDeletedError(error)) {
        return jsonResponse({ message: "User already deleted" }, 200);
      }

      throw error;
    }

    return jsonResponse({ message: "User deleted successfully" }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete user';
    return jsonResponse({ error: message }, 400);
  }
});

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

function isAlreadyDeletedError(error: { message?: string; status?: number }) {
  const message = error.message?.toLowerCase() ?? '';
  return error.status === 404 || message.includes('not found') || message.includes('does not exist');
}

async function deleteUserData(supabaseAdmin: ReturnType<typeof createClient>, userId: string) {
  const tables = [
    { name: 'user_dare_logs', column: 'user_id' },
    { name: 'user_badges', column: 'user_id' },
    { name: 'user_settings', column: 'user_id' },
    { name: 'points_transactions', column: 'user_id' },
    { name: 'profiles', column: 'id' },
  ];

  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table.name).delete().eq(table.column, userId);
    if (error && !isMissingRowError(error)) {
      throw error;
    }
  }
}

async function deleteProfileImages(supabaseAdmin: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabaseAdmin.storage.from('profile-images').list(userId);

  if (error) {
    if (isMissingRowError(error)) return;
    throw error;
  }

  const paths = (data ?? [])
    .filter((item) => item.name)
    .map((item) => `${userId}/${item.name}`);

  if (paths.length === 0) return;

  const { error: removeError } = await supabaseAdmin.storage.from('profile-images').remove(paths);
  if (removeError && !isMissingRowError(removeError)) {
    throw removeError;
  }
}

function isMissingRowError(error: { message?: string; status?: number }) {
  const message = error.message?.toLowerCase() ?? '';
  return error.status === 404 || message.includes('not found') || message.includes('does not exist');
}
