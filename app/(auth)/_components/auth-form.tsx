"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, Mail, Lock, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BorderTrail } from "@/components/ui/border-trail";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Zod validation schema factory
const createAuthFormSchema = (
  showNameField: boolean,
  showPhoneField: boolean,
  requireTermsAcceptance: boolean,
) =>
  z.object({
    name: showNameField
      ? z.string().min(2, "Name must be at least 2 characters")
      : z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phone: showPhoneField
      ? z
          .string()
          .min(1, "Phone number is required")
          .regex(/^[\d\s\-\+\(\)]+$/, "Please enter a valid phone number")
      : z.string().optional(),
    acceptTerms: requireTermsAcceptance
      ? z.boolean().refine((val) => val === true, {
          message: "You must accept the terms and conditions",
        })
      : z.boolean().optional(),
  });

export type AuthFormData = z.infer<
  ReturnType<typeof createAuthFormSchema>
>;

interface AuthFormProps {
  title: string;
  description: string;
  submitText: string;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
  onSubmit: (data: AuthFormData) => Promise<void>;
  showNameField?: boolean;
  showPhoneField?: boolean;
  requireTermsAcceptance?: boolean;
  onSuccess?: () => void;
}

export function AuthForm({
  title,
  description,
  submitText,
  footerText = "",
  footerLinkText = "",
  footerLinkHref = "",
  onSubmit,
  showNameField = false,
  showPhoneField = false,
  requireTermsAcceptance = false,
  onSuccess,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(
      createAuthFormSchema(showNameField, showPhoneField, requireTermsAcceptance),
    ),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      acceptTerms: false,
    },
  });

  const onFormSubmit = async (data: AuthFormData) => {
    setError("");
    setIsLoading(true);
    try {
      await onSubmit(data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="relative w-full max-w-md overflow-hidden">
      <BorderTrail
        className="bg-gradient-to-l from-blue-500 via-purple-500 to-pink-500"
        size={120}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "linear",
        }}
      />
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-medium">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-4"
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showNameField && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="John Doe"
                          {...field}
                          disabled={isLoading}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showPhoneField && (
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          {...field}
                          disabled={isLoading}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                        className="pl-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requireTermsAcceptance && (
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          Privacy Policy
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : submitText}
            </Button>
          </form>
        </Form>
      </CardContent>
      {footerText && footerLinkText && footerLinkHref && (
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {footerText}{" "}
            <Link
              href={footerLinkHref}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {footerLinkText}
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
