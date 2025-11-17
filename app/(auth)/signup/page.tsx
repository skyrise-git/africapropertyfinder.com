"use client";

import { useState } from "react";
import { firebaseAuth, mutate } from "@atechhub/firebase";
import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleEmailSignUp = async (data: AuthFormData) => {
    try {
      // Step 1: Create Firebase Auth user
      const authResponse = await firebaseAuth({
        action: "signup",
        email: data.email,
        password: data.password,
      });

      // Step 2: Get the user ID from auth response
      // @atechhub/firebase returns localId in the response
      const userId =
        (authResponse as { localId?: string })?.localId ||
        (authResponse as { uid?: string })?.uid ||
        getAuth(getApp()).currentUser?.uid;

      if (!userId) {
        throw new Error("Failed to get user ID after signup");
      }

      // Step 3: Save user data to database (name and phone)
      await mutate({
        action: "create",
        path: `users/${userId}`,
        data: {
          uid: userId,
          name: data.name || "",
          email: data.email,
          phone: data.phone || "",
          role: "user",
          status: "active",
          createdAt: new Date().toISOString(),
          createdBy: {
            timestamp: new Date().toISOString(),
            actionBy: "user-signup",
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            browser: navigator.userAgent.split(" ")[0],
          },
        },
        actionBy: "user-signup",
      });

      // Step 4: Show success dialog
      setShowSuccessDialog(true);
    } catch (error) {
      // Handle specific Firebase errors
      if (error instanceof Error) {
        if (error.message.includes("email-already-in-use")) {
          throw new Error(
            "This email is already registered. Please sign in instead.",
          );
        }
        if (error.message.includes("weak-password")) {
          throw new Error(
            "Password is too weak. Please use a stronger password.",
          );
        }
        if (error.message.includes("invalid-email")) {
          throw new Error("Please enter a valid email address.");
        }
        // Re-throw the original error if it has a user-friendly message
        throw error;
      }

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
              Your account has been created. You will be redirected to your
              dashboard shortly.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
