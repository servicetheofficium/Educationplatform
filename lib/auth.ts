"use server";

import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { AdminUser } from "./types";

export async function login(email: string, password: string) {
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

    if (userError)
      throw new Error(`Failed to fetch user profile: ${userError.message}`);
    if (!userData) throw new Error("User profile not found");
    if (userData.user_type !== "admin") {
      await supabase.auth.signOut();
      throw new Error("Access denied. Admin users only.");
    }

    return { success: true, user: userData as AdminUser };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userData || userData.user_type !== "admin") return null;
  return userData as AdminUser;
});
