const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !config[key]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. See backend/.env.example`,
    );
  }

  return config;
}
