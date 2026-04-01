import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Slot Selection Without Patient", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("should show error toast when slot clicked without selecting patient", async ({ page }) => {
    await app.selectSlot(testData.slots.slot9am);
    // Toast should appear with error
    await expect(page.locator("text=No Patient Selected")).toBeVisible({ timeout: 3000 });
  });

  test("should not show booking summary without patient", async () => {
    await app.selectSlot(testData.slots.slot9am);
    await expect(app.bookingSummary).not.toBeVisible();
  });
});
