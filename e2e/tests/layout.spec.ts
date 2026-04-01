import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";

test.describe("App Header and Layout", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("should display app title MedSchedule", async ({ page }) => {
    await expect(page.locator("text=MedSchedule")).toBeVisible();
  });

  test("should display patient selector in header", async () => {
    await expect(app.patientSelector).toBeVisible();
  });

  test("should display Available Times heading", async ({ page }) => {
    await expect(page.locator("h2:has-text('Available Times')")).toBeVisible();
  });

  test("should display Select Date heading", async ({ page }) => {
    await expect(page.locator("text=Select Date")).toBeVisible();
  });
});
