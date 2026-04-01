import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Repeat Test Stability - Multiple Runs", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("clean state on each run - booking works", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();
  });

  test("clean state on each run - all slots available initially", async () => {
    const count = await app.getAvailableSlotCount();
    expect(count).toBe(14);
  });

  test("full flow is repeatable - book then fail double", async () => {
    await app.selectPatientById(testData.patient007.id);

    // Book
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();

    // Try second slot same day - should fail
    await app.selectSlot(testData.slots.slot10am);
    await app.waitForBookingOutcome();
    expect(await app.isBookingFailed()).toBeTruthy();
  });

  test("patient 008 can book after state reset", async () => {
    await app.selectPatientById(testData.patient008.id);
    await app.selectSlot(testData.slots.slot1pm);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();
  });
});
