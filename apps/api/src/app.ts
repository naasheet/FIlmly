import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import routes from "./routes"
import { errorHandler } from "./middleware/error"

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
})
app.use(limiter)

app.get("/health", (_req, res) => res.json({ status: "ok" }))
app.use("/api", routes)

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" })
})

app.use(errorHandler)

export default app
