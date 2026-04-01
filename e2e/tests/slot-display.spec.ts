import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Time Slot Display", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("should display all 14 time slots on a weekday", async () => {
    const slots = await app.getAllSlots();
    expect(slots.length).toBe(14);
  });

  test("should display correct slot labels", async () => {
    for (const slotLabel of Object.values(testData.slots)) {
      await expect(app.getSlot(slotLabel)).toBeVisible();
    }
  });

  test("should show available count badge", async () => {
    await expect(app.availableBadge).toBeVisible();
    const count = await app.getAvailableSlotCount();
    expect(count).toBe(14);
  });

  test("should highlight selected slot", async () => {
    await app.selectPatientById(testData.patient007.id);
    await app.selectSlot(testData.slots.slot9am);
    const slot = app.getSlot(testData.slots.slot9am);
    const classes = await slot.getAttribute("class");
    expect(classes).toContain("border-primary");
  });
});
