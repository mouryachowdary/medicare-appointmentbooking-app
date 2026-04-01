import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Successful Booking Flow", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("should complete booking for patient 007", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    expect(await app.isBookingSuccess()).toBeTruthy();
  });

  test("should show booking ID in success message", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    const text = await app.getBookingSuccessText();
    expect(text).toContain("SLT-");
  });

  test("should show patient ID in success message", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    const text = await app.getBookingSuccessText();
    expect(text).toContain(testData.patient007.id);
  });

  test("should show provider name in success message", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    const text = await app.getBookingSuccessText();
    expect(text).toContain(testData.provider.name);
  });

  test("should disable confirm button after booking", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    await expect(app.confirmButton).toBeDisabled();
  });

  test("should complete booking for patient 008", async () => {
    await app.selectPatientById(testData.patient008.id);
    await app.selectSlot(testData.slots.slot10am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    expect(await app.isBookingSuccess()).toBeTruthy();
  });
});
