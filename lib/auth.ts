"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { loginRatelimit } from "./ratelimit";
import type { AdminUser } from "./types";

export async function login(email: string, password: string) {
  const { success } = await loginRatelimit.limit(email.trim().toLowerCase());
  if (!success) {
    return {
      success: false,
      error: "Too many login attempts. Try again in a few minutes.",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("No user returned from auth");

    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (userError || !userData || userData.user_type !== "admin") {
      if (userData && userData.user_type !== "admin") {
        await supabase.auth.signOut();
      }
      console.error("Login failed:", userError?.message ?? "profile missing or not admin");
      return { success: false, error: "Login failed" };
    }

    return { success: true, user: userData as AdminUser };
  } catch (error) {
    console.error("Login failed:", error instanceof Error ? error.message : error);
    return {
      success: false,
      error: "Login failed",
    };
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createClient();

  // proxy.ts already ran auth.getUser() for every /admin request and stamped
  // the verified id here — reuse it instead of paying for a second Auth round trip.
  let userId = (await headers()).get("x-user-id");

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    userId = user.id;
  }

  const { data: userData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!userData || userData.user_type !== "admin") return null;
  return userData as AdminUser;
});
