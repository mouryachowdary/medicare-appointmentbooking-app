import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Cross-Tab Booking Sync", () => {
  test("booking in one tab reflects in another tab", async ({ context }) => {
    // Tab 1
    const page1 = await context.newPage();
    const app1 = new AppointmentPage(page1);
    await app1.navigate();
    await app1.clearBookingData();

    // Tab 2
    const page2 = await context.newPage();
    const app2 = new AppointmentPage(page2);
    await app2.navigate();

    // Book in tab 1
    await app1.selectPatientById(testData.patient007.id);
    await app1.selectSlot(testData.slots.slot9am);
    await app1.confirmBooking();
    await app1.waitForBookingOutcome();
    expect(await app1.isBookingSuccess()).toBeTruthy();

    // Wait for sync — reload tab 2 so it picks up localStorage
    await page2.reload();
    await page2.waitForLoadState("domcontentloaded");

    // First verify localStorage propagated to tab 2
    await expect(async () => {
      const hasSlot = await page2.evaluate((slotLabel) => {
        const raw = localStorage.getItem("medschedule_bookings");
        if (!raw) return false;
        const bookings = JSON.parse(raw);
        return bookings.some((b: any) => b.slotLabel === slotLabel);
      }, testData.slots.slot9am);
      expect(hasSlot).toBeTruthy();
    }).toPass({ timeout: 5000 });

    // Slot should be disabled in tab 2
    await expect(async () => {
      expect(await app2.isSlotDisabled(testData.slots.slot9am)).toBeTruthy();
    }).toPass({ timeout: 5000 });

    await page1.close();
    await page2.close();
  });

  test("patient 008 in tab 2 cannot book slot taken by 007 in tab 1", async ({ context }) => {
    const page1 = await context.newPage();
    const app1 = new AppointmentPage(page1);
    await app1.navigate();
    await app1.clearBookingData();

    // Book in tab 1 as 007
    await app1.selectPatientById(testData.patient007.id);
    await app1.selectSlot(testData.slots.slot9am);
    await app1.confirmBooking();
    await app1.waitForBookingOutcome();

    // Tab 2 as 008
    const page2 = await context.newPage();
    const app2 = new AppointmentPage(page2);
    await app2.navigate();

    await app2.selectPatientById(testData.patient008.id);

    // Verify localStorage has the booking from tab 1
    await expect(async () => {
      const hasSlot = await page2.evaluate((slotLabel) => {
        const raw = localStorage.getItem("medschedule_bookings");
        if (!raw) return false;
        const bookings = JSON.parse(raw);
        return bookings.some((b: any) => b.slotLabel === slotLabel);
      }, testData.slots.slot9am);
      expect(hasSlot).toBeTruthy();
    }).toPass({ timeout: 5000 });

    // 9:00 AM should be disabled
    await expect(async () => {
      expect(await app2.isSlotDisabled(testData.slots.slot9am)).toBeTruthy();
    }).toPass({ timeout: 5000 });

    // 008 can book different slot
    await app2.selectSlot(testData.slots.slot10am);
    await app2.confirmBooking();
    await app2.waitForBookingOutcome();
    expect(await app2.isBookingSuccess()).toBeTruthy();

    await page1.close();
    await page2.close();
  });
});
