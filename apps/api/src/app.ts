import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import routes from "./routes"
import healthRouter from "./routes/health"
import { errorHandler } from "./middleware/error"

const app = express()

app.use(helmet())
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://filmlyweb.vercel.app",
  ],
  credentials: true,
}))
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  skip: (req) =>
    (req.method !== "GET" && req.method !== "HEAD") ||
    req.path.startsWith("/api/v1/notifications"),
})
app.use(readLimiter)

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  // Allow high-frequency notification polling to be controlled by its own limiter.
  skip: (req) =>
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.path.startsWith("/api/v1/notifications"),
})
app.use(writeLimiter)

app.use("/health", healthRouter)
app.use("/api", routes)

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" })
})

app.use(errorHandler)

export default app
