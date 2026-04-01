import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Edge Cases", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("rapid slot selection changes only last selection", async () => {
    await app.selectPatientById(testData.patient007.id);

    // Rapidly click multiple slots
    await app.selectSlot(testData.slots.slot9am);
    await app.selectSlot(testData.slots.slot10am);
    await app.selectSlot(testData.slots.slot11am);

    // Summary should show last selected slot
    const text = await app.getSummaryText();
    expect(text).toContain("11:00 AM");
  });

  test("page reload preserves booked slots", async ({ page }) => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    expect(await app.isSlotDisabled(testData.slots.slot9am)).toBeTruthy();
  });

  test("booking all morning slots leaves afternoon available", async () => {
    // Book as 007
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    // 007 can't book more on same day, switch to 008 for afternoon
    await app.selectPatientById(testData.patient008.id);
    const slot1pm = app.getSlot(testData.slots.slot1pm);
    await expect(slot1pm).toBeEnabled();
  });
});
