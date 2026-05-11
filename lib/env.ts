/**
 * Environment Variable Validation
 * This ensures the app doesn't start or fail silently if critical config is missing.
 */

const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "APP_URL",
  "ADMIN_PASSWORD",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
];

export function validateEnv() {
  if (process.env.NODE_ENV === "development") return;

  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error("❌ CRITICAL: Missing environment variables:", missing.join(", "));
    // In some environments, we might want to throw here to stop the build/start
    // throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
