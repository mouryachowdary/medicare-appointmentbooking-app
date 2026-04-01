import { Page, Locator, expect } from "@playwright/test";

export class CalendarPage {
  readonly page: Page;
  readonly calendar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.calendar = page.locator(".rdp");
  }

  async selectDay(dayNumber: number) {
    const dayButton = this.page.locator(
      `button.rdp-day:not(.rdp-day_outside):has-text("${dayNumber}")`
    ).first();
    await dayButton.waitFor({ state: "visible", timeout: 5000 });
    await expect(dayButton).toBeEnabled({ timeout: 5000 });
    await dayButton.scrollIntoViewIfNeeded();
    await dayButton.click();
  }

  async navigateToNextMonth() {
    const btn = this.page.locator('button[name="next-month"]');
    await btn.waitFor({ state: "visible", timeout: 5000 });
    await expect(btn).toBeEnabled({ timeout: 5000 });
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    // Wait for calendar to settle after month transition
    await this.page.locator(".rdp-caption_label").waitFor({ state: "visible", timeout: 5000 });
  }

  async navigateToPreviousMonth() {
    const btn = this.page.locator('button[name="previous-month"]');
    await btn.waitFor({ state: "visible", timeout: 5000 });
    await expect(btn).toBeEnabled({ timeout: 5000 });
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await this.page.locator(".rdp-caption_label").waitFor({ state: "visible", timeout: 5000 });
  }

  async isWeekendDisabled(dayNumber: number): Promise<boolean> {
    const dayButton = this.page.locator(
      `button.rdp-day:not(.rdp-day_outside):has-text("${dayNumber}")`
    ).first();
    return dayButton.isDisabled();
  }

  async getCalendarCaption(): Promise<string> {
    return (await this.page.locator(".rdp-caption_label").textContent()) ?? "";
  }
}
