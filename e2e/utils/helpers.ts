import { Page } from "@playwright/test";

/**
 * Clear all booking data from localStorage to ensure clean state
 */
export async function clearBookingState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("medschedule_bookings");
    localStorage.removeItem("medschedule_bookings_timestamp");
  });
}

/**
 * Get the next weekday from today (skips weekends)
 */
export function getNextWeekday(): Date {
  const date = new Date();
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() + 1); // Sunday → Monday
  if (day === 6) date.setDate(date.getDate() + 2); // Saturday → Monday
  return date;
}

/**
 * Get a future weekday (offset days from today, skipping weekends)
 */
export function getFutureWeekday(daysAhead: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() + 1);
  if (day === 6) date.setDate(date.getDate() + 2);
  return date;
}
