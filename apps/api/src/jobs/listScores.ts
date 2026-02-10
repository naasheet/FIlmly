import { listService } from "../services/listService"

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

let started = false

export function startListScoreJobs() {
  if (started) return
  started = true

  void listService.recalculateTrendingScores()
  void listService.recalculatePopularityScores()

  setInterval(() => {
    void listService.recalculateTrendingScores()
  }, HOUR_MS)

  setInterval(() => {
    void listService.recalculatePopularityScores()
  }, DAY_MS)
}
