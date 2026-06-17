import { supabase } from "@/integrations/supabase/client";

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // Ensure profile row exists (belt-and-braces; trigger also handles new users).
  if (data.user) {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          name:
            (data.user.user_metadata?.full_name as string | undefined) ??
            data.user.email?.split("@")[0] ??
            null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
  }
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function isAuthenticated() {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
