import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Multiple Bookings - Different Patients Different Slots", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("007 and 008 can each book one slot on same day", async () => {
    // Patient 007
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();

    // Patient 008
    await app.selectPatientById(testData.patient008.id);
    await app.selectSlot(testData.slots.slot10am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();
  });

  test("after both book, both slots are disabled", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    await app.selectPatientById(testData.patient008.id);
    await app.selectSlot(testData.slots.slot10am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    expect(await app.isSlotDisabled(testData.slots.slot9am)).toBeTruthy();
    expect(await app.isSlotDisabled(testData.slots.slot10am)).toBeTruthy();
  });

  test("available count decreases by 2 after two bookings", async () => {
    const initial = await app.getAvailableSlotCount();

    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    await app.selectPatientById(testData.patient008.id);
    await app.selectSlot(testData.slots.slot10am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    const final = await app.getAvailableSlotCount();
    expect(final).toBe(initial - 2);
  });
});
