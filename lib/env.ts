import { z } from "zod";

const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("Supabase URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required"),
  // Google Maps Configuration
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z
    .string()
    .optional(),
  // UploadThing Configuration (server-only, optional)
  UPLOADTHING_TOKEN: z.string().min(1).optional(),
});

function validateEnv() {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN || undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      throw new Error(
        "Invalid environment variables:\n" +
          missingVars.join("\n") +
          "\n\nPlease check your .env.local file."
      );
    }
    throw error;
  }
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
