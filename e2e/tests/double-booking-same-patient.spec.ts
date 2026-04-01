import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Double Booking Prevention - Same Patient Same Day", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("patient 007 cannot book two slots on same day", async () => {
    await app.selectPatientById(testData.patient007.id);

    // First booking
    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();

    // Attempt second booking on same day
    await app.selectSlot(testData.slots.slot10am);
    await app.waitForBookingOutcome();
    expect(await app.isBookingFailed()).toBeTruthy();
  });

  test("patient 007 cannot rebook same slot", async () => {
    await app.selectPatientById(testData.patient007.id);

    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();
    expect(await app.isBookingSuccess()).toBeTruthy();

    // Try same slot again
    await app.selectSlot(testData.slots.slot9am);
    await app.waitForBookingOutcome();
    expect(await app.isBookingFailed()).toBeTruthy();
  });

  test("shows correct error message for double booking", async () => {
    await app.selectPatientById(testData.patient007.id);

    await app.selectSlot(testData.slots.slot9am);
    await app.confirmBooking();
    await app.waitForBookingOutcome();

    await app.selectSlot(testData.slots.slot1pm);
    await app.waitForBookingOutcome();

    const text = await app.getBookingFailedText();
    expect(text).toContain("already have an appointment");
  });
});
