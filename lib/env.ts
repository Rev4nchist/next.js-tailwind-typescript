import { z } from 'zod';

// Define expected environment variables and their types
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // SpacetimeDB
  NEXT_PUBLIC_SPACETIMEDB_URI: z.string().url(),
  SPACETIMEDB_DB_NAME: z.string().min(1),

  // Clerk (Add specific keys as needed, using .min(1) for required non-empty strings)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  // Add other Clerk keys if used (e.g., NEXT_PUBLIC_CLERK_SIGN_IN_URL)

  // Add other variables if needed
  // NEXT_PUBLIC_API_URL: z.string().url().optional(),
});

// Parse and validate process.env
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables. Check `.env` file.');
}

// Export the validated and typed environment variables
export const env = parsedEnv.data;

// Augment NodeJS.ProcessEnv type for TypeScript IntelliSense
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
} 