import { listService } from "../services/listService"

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

let started = false

async function runJobSafely(name: string, job: () => Promise<void>) {
  try {
    await job()
  } catch (error) {
    // Jobs are best-effort; log and continue serving API traffic.
    // eslint-disable-next-line no-console
    console.error(`[list-scores] ${name} failed`, error)
  }
}

export function startListScoreJobs() {
  if (started) return
  started = true

  void runJobSafely("recalculateTrendingScores", () => listService.recalculateTrendingScores())
  void runJobSafely("recalculatePopularityScores", () => listService.recalculatePopularityScores())

  setInterval(() => {
    void runJobSafely("recalculateTrendingScores", () => listService.recalculateTrendingScores())
  }, HOUR_MS)

  setInterval(() => {
    void runJobSafely("recalculatePopularityScores", () => listService.recalculatePopularityScores())
  }, DAY_MS)
}
