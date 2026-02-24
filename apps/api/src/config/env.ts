const required = ["JWT_SECRET", "TMDB_API_KEY"] as const

type EnvVars = {
  JWT_SECRET: string
  TMDB_API_KEY: string
  OMDB_API_KEY?: string
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  PORT: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  BREVO_API_KEY?: string
  BREVO_SENDER_EMAIL?: string
  BREVO_SENDER_NAME?: string
  RESET_CODE_TTL_MINUTES?: string
  RESET_CODE_LENGTH?: string
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const env: EnvVars = {
  JWT_SECRET: getEnv("JWT_SECRET"),
  TMDB_API_KEY: getEnv("TMDB_API_KEY"),
  OMDB_API_KEY: process.env.OMDB_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  PORT: process.env.PORT ?? "4000",
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME,
  RESET_CODE_TTL_MINUTES: process.env.RESET_CODE_TTL_MINUTES,
  RESET_CODE_LENGTH: process.env.RESET_CODE_LENGTH,
}
