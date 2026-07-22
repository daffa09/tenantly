const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'] as const;

/**
 * Fail at boot instead of at the first request. A missing JWT_SECRET used to
 * fall back to a constant checked into the repo, which silently turns every
 * signature into one an attacker can forge.
 */
export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !config[key]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. See backend/.env.example`,
    );
  }

  return config;
}
