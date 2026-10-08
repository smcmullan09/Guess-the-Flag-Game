const { test, expect } = require('@playwright/test');
const { countries } = require('../countries.js');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function currentCountry(page) {
  const src = await page.locator('#quiz-flag').getAttribute('src');
  return countries.find(country => src.endsWith(`/${country.code}.svg`));
}
async function start(page, region = 'Oceania') {
  await page.getByRole('button', { name: new RegExp(`^${region},`) }).click();
  await expect(page.locator('#game-screen')).toBeVisible();
  await expect(page.locator('#answer')).toBeFocused();
}
test('Desktop setup, help dialog and all seven region choices', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('SMM Flag Quiz');
  await expect(page.locator('.region-card')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'World, 195 countries. Start quiz' })).toBeVisible();
  await page.screenshot({ path: 'screenshots/desktop.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'How to play' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});
test('Automatic answers, wrong guesses and skips work with focus and a continuous timer', async ({ page }) => {
  await page.goto('/');
  await start(page, 'World');
  await expect(page.locator('#total-count')).toHaveText('195');
  const first = await currentCountry(page);
  await page.locator('#answer').fill(`  ${first.name.toUpperCase()}  `);
  await expect(page.locator('#correct-count')).toHaveText('1');
  await expect(page.locator('#answer')).toHaveValue('');
  await expect(page.locator('#feedback')).toContainText(`Correct — ${first.name}`);
  expect((await currentCountry(page)).code).not.toBe(first.code);
  const missed = await currentCountry(page);
  await page.locator('#answer').fill('This is incorrect');
  await expect(page.locator('#correct-count')).toHaveText('1');
  await page.locator('#answer').press('Enter');
  await expect(page.locator('#feedback')).toContainText(missed.name);
  await expect(page.locator('#skip-button')).toBeDisabled();
  await page.screenshot({ path: 'screenshots/incorrect.png', fullPage: true, animations: 'disabled' });
  await expect(page.locator('#skip-button')).toBeEnabled();
  expect((await currentCountry(page)).code).not.toBe(missed.code);
  await expect(page.locator('#answer')).toBeFocused();
  await expect(page.locator('#timer')).not.toHaveText('00:00');
  const skipped = await currentCountry(page);
  await page.locator('#answer').press('Enter');
  await expect(page.locator('#feedback')).toContainText(`Skipped — ${skipped.name}`);
  await expect(page.locator('#skip-button')).toBeEnabled();
  expect((await currentCountry(page)).code).not.toBe(skipped.code);
  const skippedAgain = await currentCountry(page);
  await page.getByRole('button', { name: 'Skip', exact: false }).click();
  await expect(page.locator('#feedback')).toContainText(skippedAgain.name);
  await expect(page.locator('#correct-count')).toHaveText('1');
  await expect(page.locator('#skip-button')).toBeEnabled();
  await page.screenshot({ path: 'screenshots/game.png', fullPage: true, animations: 'disabled' });
});
test('Completes all flags after misses, freezes time, restarts, and changes region', async ({ page }) => {
  await page.goto('/');
  await start(page);
  await page.locator('#answer').fill('wrong');
  await page.locator('#answer').press('Enter');
  await expect(page.locator('#skip-button')).toBeEnabled();
  await page.getByRole('button', { name: 'Skip', exact: false }).click();
  await expect(page.locator('#skip-button')).toBeEnabled();
  const seen = new Set();
  for (let i = 0; i < 14; i++) {
    const country = await currentCountry(page);
    expect(seen.has(country.code)).toBe(false);
    seen.add(country.code);
    await page.locator('#answer').fill(country.name);
  }
  await expect(page.locator('#complete-screen')).toBeVisible();
  await expect(page.locator('#result-flags')).toHaveText('14 / 14 Flags');
  await expect(page.locator('#stat-incorrect')).toHaveText('1');
  await expect(page.locator('#stat-skips')).toHaveText('1');
  await expect(page.locator('#record-badge')).toHaveText('NEW PERSONAL BEST');
  const final = await page.locator('#final-time').textContent();
  await page.screenshot({ path: 'screenshots/complete.png', fullPage: true, animations: 'disabled' });
  await page.waitForTimeout(1100);
  await expect(page.locator('#final-time')).toHaveText(final);
  await expect(page.locator('#timer')).toHaveText(final);
  await page.getByRole('button', { name: 'Play Again' }).click();
  await expect(page.locator('#game-screen')).toBeVisible();
  await expect(page.locator('#correct-count')).toHaveText('0');
  await expect(page.locator('#total-count')).toHaveText('14');
  await expect(page.locator('#timer')).toHaveText('00:00');
  for (let i = 0; i < 14; i++) await page.locator('#answer').fill((await currentCountry(page)).name);
  await expect(page.locator('#stat-incorrect')).toHaveText('0');
  await expect(page.locator('#stat-skips')).toHaveText('0');
  await page.getByRole('button', { name: 'Change Region' }).click();
  await expect(page.locator('#setup-screen')).toBeVisible();
});
test('Mobile and tablet screens fit their viewports and preserve flag proportions', async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 390) await page.screenshot({ path: 'screenshots/mobile.png', fullPage: true, animations: 'disabled' });
    await start(page, 'Asia');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const flag = await page.locator('#quiz-flag').evaluate(image => ({ complete: image.complete, naturalWidth: image.naturalWidth, ratio: image.naturalWidth / image.naturalHeight, displayedRatio: image.clientWidth / image.clientHeight }));
    expect(flag.complete).toBe(true);
    expect(flag.naturalWidth).toBeGreaterThan(0);
    expect(Math.abs(flag.ratio - flag.displayedRatio)).toBeLessThan(.02);
    await expect(page.locator('#answer')).toBeVisible();
    await expect(page.locator('#skip-button')).toBeVisible();
    if (width === 390) await page.screenshot({ path: 'screenshots/mobile-game.png', fullPage: true, animations: 'disabled' });
  }
});
test('Works by opening index.html directly with network access disabled', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  await start(page, 'Europe');
  await expect(page.locator('#total-count')).toHaveText('44');
  await page.locator('#answer').fill((await currentCountry(page)).name);
  await expect(page.locator('#correct-count')).toHaveText('1');
});
