/**
 * Single place to read environment variables.
 * If a required variable is missing, the app fails at boot instead of at
 * runtime.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV,
  // Example of a required variable once a database is added:
  // databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),
};

export { required };
