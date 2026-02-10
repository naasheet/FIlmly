import "dotenv/config"
import app from "./app"
import { env } from "./config/env"
import { startListScoreJobs } from "./jobs/listScores"

const port = Number(env.PORT)

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`)
})

startListScoreJobs()
