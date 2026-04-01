import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Booking Data Expiry (1 minute)", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("bookings persist in localStorage after booking", async ({ page }) => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    const bookings = await page.evaluate(() =>
      localStorage.getItem("medschedule_bookings")
    );
    expect(bookings).not.toBeNull();
    expect(JSON.parse(bookings!).length).toBe(1);
  });

  test("timestamp is set on first booking", async ({ page }) => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    const ts = await page.evaluate(() =>
      localStorage.getItem("medschedule_bookings_timestamp")
    );
    expect(ts).not.toBeNull();
    expect(Number(ts)).toBeGreaterThan(0);
  });

  test("expired bookings are cleared on reload", async ({ page }) => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    // Manually set timestamp to past (expired)
    await page.evaluate(() => {
      localStorage.setItem(
        "medschedule_bookings_timestamp",
        String(Date.now() - 120000) // 2 minutes ago
      );
    });

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Slot should be available again
    expect(await app.isSlotDisabled(testData.slots.slot9am)).toBeFalsy();
  });
});
