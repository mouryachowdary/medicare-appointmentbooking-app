import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Patient Switching State Reset", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("switching patient clears selected slot", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await expect(app.bookingSummary).toBeVisible();

    // Switch patient
    await app.selectPatientById(testData.patient008.id);
    await expect(app.bookingSummary).not.toBeVisible();
  });

  test("switching patient clears booking confirmation", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();

    // Switch patient
    await app.selectPatientById(testData.patient008.id);
    expect(await app.isBookingSuccess()).toBeFalsy();
  });

  test("switching patient clears booking failed state", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    // Trigger failed state
    await app.selectSlot(testData.slots.slot10am);
    await app.waitForBookingOutcome();
    expect(await app.isBookingFailed()).toBeTruthy();

    // Switch patient
    await app.selectPatientById(testData.patient008.id);
    expect(await app.isBookingFailed()).toBeFalsy();
  });
});
