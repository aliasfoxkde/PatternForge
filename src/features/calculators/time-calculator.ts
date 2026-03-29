/**
 * Time estimator for fiber arts projects.
 *
 * Estimates project completion time from total stitch count
 * and personal stitching speed, with milestone markers.
 */

/** Default stitches per minute for cross stitch. */
export const DEFAULT_STITCHES_PER_MINUTE = 20;

/** Default hours per day spent stitching. */
export const DEFAULT_HOURS_PER_DAY = 2;

/** Default stitching days per week. */
export const DEFAULT_DAYS_PER_WEEK = 5;

export interface TimeCalculatorInput {
  /** Total stitch count in the project. */
  totalStitches: number;
  /** Stitches completed per minute. */
  stitchesPerMinute: number;
  /** Hours spent stitching per day. */
  hoursPerDay: number;
  /** Days per week spent stitching. */
  daysPerWeek: number;
}

export interface TimeMilestone {
  /** Stitch count threshold for this milestone. */
  stitches: number;
  /** Human-readable label (e.g. "25%"). */
  label: string;
  /** Estimated time string for this milestone. */
  time: string;
}

export interface TimeCalculatorResult {
  /** Total time in minutes. */
  totalMinutes: number;
  /** Total time in hours. */
  totalHours: number;
  /** Total time in 8-hour work days. */
  totalDays: number;
  /** Total time in calendar weeks (accounting for schedule). */
  totalWeeks: number;
  /** Calendar days needed (accounting for hours/day and days/week). */
  calendarDays: number;
  /** Progress milestones at 25%, 50%, 75%, 100%. */
  milestones: TimeMilestone[];
}

/**
 * Format a number of minutes into a human-readable string.
 */
function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  const days = hours / 24;
  if (days < 7) return `${Math.round(days * 10) / 10}d`;
  const weeks = days / 7;
  return `${Math.round(weeks * 10) / 10}w`;
}

/**
 * Estimate project completion time from stitch count and stitching speed.
 *
 * @param input - The time calculator parameters
 * @returns Time estimates with milestones
 */
export function calculateTime(
  input: TimeCalculatorInput,
): TimeCalculatorResult {
  const { totalStitches, stitchesPerMinute, hoursPerDay, daysPerWeek } =
    input;

  const totalMinutes = totalStitches / stitchesPerMinute;
  const totalHours = totalMinutes / 60;
  const totalDays = totalHours / 24;
  const totalWeeks = totalDays / 7;

  // Calendar days accounting for the stitching schedule
  const minutesPerDay = hoursPerDay * 60;
  const minutesPerWeek = minutesPerDay * daysPerWeek;
  const calendarDays =
    minutesPerWeek > 0 ? totalMinutes / (minutesPerWeek / 7) : 0;

  // Milestones
  const percentages = [0.25, 0.5, 0.75, 1.0];
  const milestones: TimeMilestone[] = percentages.map((pct) => {
    const stitches = Math.round(totalStitches * pct);
    const minutes = stitches / stitchesPerMinute;
    const label = `${Math.round(pct * 100)}%`;
    const time = formatMinutes(minutes);
    return { stitches, label, time };
  });

  return {
    totalMinutes: Math.round(totalMinutes),
    totalHours: Math.round(totalHours * 10) / 10,
    totalDays: Math.round(totalDays * 10) / 10,
    totalWeeks: Math.round(totalWeeks * 10) / 10,
    calendarDays: Math.round(calendarDays),
    milestones,
  };
}
