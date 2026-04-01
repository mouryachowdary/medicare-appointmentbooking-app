import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Booking Summary Display", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
    await app.selectPatientById(testData.patient007.id);
  });

  test("should show booking summary when slot selected", async () => {
    await app.selectSlot(testData.slots.slot9am);
    await expect(app.bookingSummary).toBeVisible();
  });

  test("should display provider name in summary", async () => {
    await app.selectSlot(testData.slots.slot9am);
    const text = await app.getSummaryText();
    expect(text).toContain(testData.provider.name);
  });

  test("should display selected time in summary", async () => {
    await app.selectSlot(testData.slots.slot2pm);
    const text = await app.getSummaryText();
    expect(text).toContain("2:00 PM");
  });

  test("should show confirm button enabled", async () => {
    await app.selectSlot(testData.slots.slot9am);
    await expect(app.confirmButton).toBeEnabled();
  });

  test("should hide summary when no slot selected", async () => {
    await expect(app.bookingSummary).not.toBeVisible();
  });
});
