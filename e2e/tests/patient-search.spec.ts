import { test, expect } from "../../playwright-fixture";
import { AppointmentPage } from "../pages/AppointmentPage";
import { testData } from "../utils/testData";

test.describe("Patient Search and Selection", () => {
  let app: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    app = new AppointmentPage(page);
    await app.navigate();
    await app.clearBookingData();
  });

  test("should show 'Select Patient' by default with no name", async () => {
    const text = await app.getSelectedPatientText();
    expect(text).toContain("Select Patient");
  });

  test("should search patient by ID and select", async ({ page }) => {
    await app.selectPatientById(testData.patient007.id);
    await expect(app.patientSelector).toContainText(testData.patient007.name);
  });

  test("should search patient by name and select", async ({ page }) => {
    await app.selectPatientByName(testData.patient008.name, testData.patient008.id);
    await expect(app.patientSelector).toContainText(testData.patient008.name);
  });

  test("should show 'No patients found' for invalid search", async ({ page }) => {
    await app.searchPatient("ZZZZZ");
    await expect(page.locator("text=No patients found")).toBeVisible();
  });

  test("should show search prompt when dropdown opened with no input", async ({ page }) => {
    await app.patientSelector.click();
    await expect(page.locator("text=Type a name or ID to search")).toBeVisible();
  });

  test("should switch between patients", async () => {
    await app.selectPatientById(testData.patient007.id);
    await expect(app.patientSelector).toContainText(testData.patient007.name);

    await app.selectPatientById(testData.patient008.id);
    await expect(app.patientSelector).toContainText(testData.patient008.name);
  });
});
