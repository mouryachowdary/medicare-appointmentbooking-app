import { Page, Locator, expect } from "@playwright/test";

export class AppointmentPage {
  readonly page: Page;
  readonly patientSelector: Locator;
  readonly patientSearch: Locator;
  readonly bookingSummary: Locator;
  readonly confirmButton: Locator;
  readonly bookingSuccess: Locator;
  readonly bookingFailed: Locator;
  readonly header: Locator;
  readonly providerCard: Locator;
  readonly availableBadge: Locator;
  readonly dateTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.patientSelector = page.getByTestId("patient-selector");
    this.patientSearch = page.getByTestId("patient-search");
    this.bookingSummary = page.getByTestId("booking-summary");
    this.confirmButton = page.getByTestId("confirm-button");
    this.bookingSuccess = page.getByTestId("booking-success");
    this.bookingFailed = page.getByTestId("booking-failed");
    this.header = page.locator("header");
    this.providerCard = page.locator("text=Dr. Sarah Mitchell");
    this.availableBadge = page.locator("text=/\\d+ available/");
    this.dateTitle = page.locator("h2:has-text('Available Times') + p");
  }

  async navigate() {
    await this.page.goto("/");
    await this.page.waitForLoadState("domcontentloaded");
    await this.patientSelector.waitFor({ state: "visible", timeout: 15000 });
  }

  async clearBookingData() {
    await this.page.evaluate(() => {
      localStorage.removeItem("medschedule_bookings");
      localStorage.removeItem("medschedule_bookings_timestamp");
    });
    await this.page.reload();
    await this.page.waitForLoadState("domcontentloaded");
    await this.patientSelector.waitFor({ state: "visible", timeout: 15000 });
  }

  async selectPatient(patientId: string, patientName: string) {
    await this.patientSelector.click();
    await this.patientSearch.fill(patientId);
    await this.page.getByTestId(`patient-${patientId}`).click();
    // Verify selection
    await expect(this.patientSelector).toContainText(patientName);
  }

  async selectPatientById(patientId: string) {
    await this.patientSelector.click();
    await this.patientSearch.fill(patientId);
    await this.page.getByTestId(`patient-${patientId}`).click();
  }

  async selectPatientByName(name: string, patientId: string) {
    await this.patientSelector.click();
    await this.patientSearch.fill(name);
    await this.page.getByTestId(`patient-${patientId}`).click();
  }

  async searchPatient(query: string) {
    await this.patientSelector.click();
    await this.patientSearch.fill(query);
  }

  getPatientOption(patientId: string): Locator {
    return this.page.getByTestId(`patient-${patientId}`);
  }

  getSlot(slotLabel: string): Locator {
    const testId = `slot-${slotLabel.replace(/\s+/g, "-").toLowerCase()}`;
    return this.page.getByTestId(testId);
  }

  async selectSlot(slotLabel: string) {
    await this.getSlot(slotLabel).click();
  }

  async confirmBooking() {
    await this.confirmButton.waitFor({ state: "visible", timeout: 10000 });
    await expect(this.confirmButton).toBeEnabled({ timeout: 10000 });
    await this.confirmButton.scrollIntoViewIfNeeded();
    await this.confirmButton.click();
  }

  async waitForBookingOutcome(timeout = 10000) {
    await Promise.race([
      this.bookingSuccess.waitFor({ state: "visible", timeout }).catch(() => {}),
      this.bookingFailed.waitFor({ state: "visible", timeout }).catch(() => {}),
    ]);
  }

  async isBookingSuccess(): Promise<boolean> {
    return this.bookingSuccess.isVisible();
  }

  async isBookingFailed(): Promise<boolean> {
    return this.bookingFailed.isVisible();
  }

  async isSummaryVisible(): Promise<boolean> {
    return this.bookingSummary.isVisible();
  }

  async isSlotBooked(slotLabel: string): Promise<boolean> {
    const slot = this.getSlot(slotLabel);
    const classes = await slot.getAttribute("class");
    return classes?.includes("line-through") || false;
  }

  async isSlotDisabled(slotLabel: string): Promise<boolean> {
    return this.getSlot(slotLabel).isDisabled();
  }

  async getAvailableSlotCount(): Promise<number> {
    const text = await this.availableBadge.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async selectCalendarDay(dayNumber: number) {
    // Click a specific day number in the calendar
    const dayButton = this.page.locator(
      `button.rdp-day:not(.rdp-day_outside):has-text("${dayNumber}")`
    ).first();
    await dayButton.click();
  }

  async getSelectedPatientText(): Promise<string> {
    return (await this.patientSelector.textContent()) ?? "";
  }

  async getBookingSuccessText(): Promise<string> {
    return (await this.bookingSuccess.textContent()) ?? "";
  }

  async getBookingFailedText(): Promise<string> {
    return (await this.bookingFailed.textContent()) ?? "";
  }

  async getSummaryText(): Promise<string> {
    return (await this.bookingSummary.textContent()) ?? "";
  }

  async getAllSlots(): Promise<Locator[]> {
    const grid = this.page.locator("[data-testid^='slot-']");
    return grid.all();
  }
}
