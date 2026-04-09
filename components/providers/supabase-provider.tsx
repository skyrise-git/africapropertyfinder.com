"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/hooks/use-app-store";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Spinner } from "@/components/ui/spinner";
import type { User } from "@/lib/types/user.type";

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const setUser = useAppStore((state) => state.setUser);
  const [isInitializing, setIsInitializing] = useState(true);

  useAuthGuard(["/signin", "/signup", "/signup/agent"]);

  useEffect(() => {
    const supabase = createClient();

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        const row = data as Record<string, unknown>;
        const userData: User = {
          id: row.id as string,
          uid: row.id as string,
          name: (row.name as string) ?? "",
          email: (row.email as string) ?? "",
          role: ((row.role as string) ?? "user") as User["role"],
          status: ((row.status as string) ?? "active") as User["status"],
          password: "",
          profilePicture: (row.profilePicture as string) ?? undefined,
          profilePictureFileKey: (row.profilePictureFileKey as string) ?? undefined,
          createdAt: (row.createdAt as string) ?? new Date().toISOString(),
          updatedAt: (row.updatedAt as string) ?? undefined,
        };
        setUser(userData);
        return;
      }

      const { data: sessionData } = await supabase.auth.getUser();
      const authUser = sessionData?.user;
      if (!authUser) return;

      const meta = (authUser.user_metadata ?? {}) as Record<string, string>;
      const role = (meta.role || "user") as User["role"];

      const { error: insertError } = await supabase.from("profiles").upsert(
        {
          id: authUser.id,
          email: authUser.email ?? "",
          name: meta.name ?? "",
          role,
          status: "active",
        },
        { onConflict: "id" }
      );

      if (!insertError) {
        const userData: User = {
          id: authUser.id,
          uid: authUser.id,
          name: meta.name ?? "",
          email: authUser.email ?? "",
          role,
          status: "active",
          password: "",
          createdAt: authUser.created_at ?? new Date().toISOString(),
        };
        setUser(userData);

        if (role === "agent") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("agent_profiles")
            .upsert({ user_id: authUser.id }, { onConflict: "user_id" });
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsInitializing(false));
      } else {
        setUser(null);
        setIsInitializing(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <>{children}</>;
}
