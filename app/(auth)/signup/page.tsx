"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthForm, type AuthFormData } from "../_components/auth-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

export default function SignUpPage() {
  const router = useRouter();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (!showSuccessDialog) return;
    const timer = setTimeout(() => {
      router.push("/");
    }, 2500);
    return () => clearTimeout(timer);
  }, [showSuccessDialog, router]);

  const handleEmailSignUp = async (data: AuthFormData) => {
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name || "",
            phone: data.phone || "",
            role: "user",
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error(
            "This email is already registered. Please sign in instead."
          );
        }
        if (
          error.message.includes("weak") ||
          error.message.includes("password")
        ) {
          throw new Error(
            "Password is too weak. Please use a stronger password."
          );
        }
        if (error.message.includes("invalid") && error.message.includes("email")) {
          throw new Error("Please enter a valid email address.");
        }
        throw new Error(error.message);
      }

      setShowSuccessDialog(true);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Failed to create account. Please try again.");
    }
  };

  return (
    <>
      <AuthForm
        title="Create an account"
        description="Sign up to get started with your account"
        submitText="Sign up"
        onSubmit={handleEmailSignUp}
        showNameField={true}
        showPhoneField={true}
        requireTermsAcceptance={true}
        footerText="Already have an account?"
        footerLinkText="Sign in"
        footerLinkHref="/signin"
      />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Are you a real estate agent?{" "}
        <Link
          href="/signup/agent"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Register as an Agent — it&apos;s free
        </Link>
      </p>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </motion.div>
            <DialogTitle className="text-center text-2xl">
              Account Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your account has been created. Redirecting...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
