import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Provider Information Display", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("should display provider name", async ({ page }) => {
    await expect(page.locator(`text=${testData.provider.name}`)).toBeVisible();
  });

  test("should display provider specialty", async ({ page }) => {
    await expect(page.locator(`text=${testData.provider.specialty}`)).toBeVisible();
  });

  test("should display provider credentials", async ({ page }) => {
    await expect(page.locator(`text=${testData.provider.credentials}`)).toBeVisible();
  });

  test("should display provider rating", async ({ page }) => {
    await expect(page.locator("text=4.9")).toBeVisible();
  });

  test("should display review count", async ({ page }) => {
    await expect(page.locator("text=237 reviews")).toBeVisible();
  });
});
