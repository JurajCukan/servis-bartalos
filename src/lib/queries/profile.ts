import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  name: string | null;
  role: "technik" | "manažér";
};

export function useProfileQuery() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: async (): Promise<{ profile: Profile | null; email: string | null }> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return { profile: null, email: null };
      const { data } = await supabase
        .from("profiles")
        .select("id, name, role")
        .eq("id", user.id)
        .maybeSingle();
      return { profile: (data as Profile | null) ?? null, email: user.email ?? null };
    },
    staleTime: 5 * 60_000,
  });
}
