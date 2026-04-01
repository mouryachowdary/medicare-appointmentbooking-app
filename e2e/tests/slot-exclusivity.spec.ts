import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Slot Exclusivity - Cross Patient", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("slot booked by 007 is disabled for 008", async () => {
    // Patient 007 books 9:00 AM
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();

    // Switch to patient 008
    await app.selectPatientById(testData.patient008.id);

    // 9:00 AM slot should be booked/disabled
    expect(await app.isSlotDisabled(testData.slots.slot9am)).toBeTruthy();
  });

  test("patient 008 can book a different slot after 007 books", async () => {
    // Patient 007 books 9:00 AM
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();

    // Patient 008 books 10:00 AM
    await app.selectPatientById(testData.patient008.id);
    await app.selectSlot(testData.slots.slot10am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();
  });

  test("both patients can book different slots on same day", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();

    await app.selectPatientById(testData.patient008.id);
    await app.selectSlot(testData.slots.slot2pm);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();
  });

  test("available count decreases after booking", async () => {
    const initialCount = await app.getAvailableSlotCount();

    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    const newCount = await app.getAvailableSlotCount();
    expect(newCount).toBe(initialCount - 1);
  });
});
