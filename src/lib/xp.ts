import { LEVEL_THRESHOLDS, XP_VALUES, type XPEvent } from '@/types'

export function getLevelForXP(totalXP: number) {
  let current = LEVEL_THRESHOLDS[0]
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalXP >= threshold.min) {
      current = threshold
    }
  }
  return current
}

export function getXPToNextLevel(totalXP: number): {
  current: typeof LEVEL_THRESHOLDS[0]
  next: typeof LEVEL_THRESHOLDS[0] | null
  progress: number // 0-100
  xpInLevel: number
  xpNeeded: number
} {
  const current = getLevelForXP(totalXP)
  const currentIndex = LEVEL_THRESHOLDS.findIndex(
    (t) => t.level === current.level
  )
  const next = LEVEL_THRESHOLDS[currentIndex + 1] ?? null

  if (!next) {
    return { current, next: null, progress: 100, xpInLevel: 0, xpNeeded: 0 }
  }

  const xpInLevel = totalXP - current.min
  const xpNeeded = next.min - current.min
  const progress = Math.min(100, Math.floor((xpInLevel / xpNeeded) * 100))

  return { current, next, progress, xpInLevel, xpNeeded }
}

export function getXPForEvent(event: XPEvent): number {
  return XP_VALUES[event]
}
