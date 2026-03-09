"use client";

import { createClient } from "@/lib/supabase/client";
import { AuthForm, type AuthFormData } from "../_components/auth-form";

export default function SignInPage() {
  const handleEmailSignIn = async (data: AuthFormData) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error(
            "Invalid email or password. Please check your credentials."
          );
        }
        if (error.message.includes("too_many_requests")) {
          throw new Error("Too many failed attempts. Please try again later.");
        }
        if (error.message.includes("user_banned")) {
          throw new Error(
            "This account has been disabled. Please contact support."
          );
        }
        throw new Error(error.message);
      }
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Failed to sign in. Please check your credentials.");
    }
  };

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to your account to continue"
      submitText="Sign in"
      onSubmit={handleEmailSignIn}
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/signup"
    />
  );
}
