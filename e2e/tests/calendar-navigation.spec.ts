import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { CalendarPage } from "../pages/CalendarPage";

test.describe("Calendar Date Selection", () => {
  let app: AppointmentPage;
  let calendar: CalendarPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    calendar = new CalendarPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("should display the calendar with current month", async () => {
    await expect(calendar.calendar).toBeVisible();
    const caption = await calendar.getCalendarCaption();
    expect(caption.length).toBeGreaterThan(0);
  });

  test("should navigate to next month", async () => {
    const currentCaption = await calendar.getCalendarCaption();
    await calendar.navigateToNextMonth();
    const newCaption = await calendar.getCalendarCaption();
    expect(newCaption).not.toBe(currentCaption);
  });

  test("should show slots when a weekday is selected", async ({ page }) => {
    // Navigate to next month to find guaranteed weekdays
    await calendar.navigateToNextMonth();
    // Select day 1 (likely a weekday or check)
    await calendar.selectDay(7); // Pick 7th which is usually mid-week
    const slots = await app.getAllSlots();
    expect(slots.length).toBeGreaterThan(0);
  });

  test("should reset selected slot when date changes", async () => {
    await app.selectPatientById("007");
    await app.selectSlot("9:00 AM");
    await expect(app.bookingSummary).toBeVisible();

    // Change date
    await calendar.navigateToNextMonth();
    await calendar.selectDay(10);
    // Summary should disappear since slot selection is reset
    await expect(app.bookingSummary).not.toBeVisible();
  });
});
