'use server';

import { cookies } from "next/headers";
import { createClient } from "../../utils/supabase/server";

export async function anonymous() {
  try {
    const supabase = createClient(await cookies());
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error retrieving session:", sessionError.message);
      return { data: null, error: sessionError.message };
    }

    if (sessionData.session) {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error validating current user:", userError.message);
        return { data: null, error: userError.message };
      }

      return {
        data: { user: userData.user, session: sessionData.session },
        error: null,
      };
    }

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error("Error signing in anonymously:", error.message);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected error while retrieving or creating user:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

