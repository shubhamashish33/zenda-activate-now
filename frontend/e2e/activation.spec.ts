import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import mysql, { Connection } from 'mysql2/promise';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

let database: Connection;
const evidence = resolve('../docs/evidence');

test.beforeAll(async () => {
  const schema = process.env['E2E_DB_NAME'] || 'zenda';
  if (!['zenda', 'zenda_e2e'].includes(schema))
    throw new Error('Browser tests may only use the documented synthetic demo schemas.');
  database = await mysql.createConnection({
    host: process.env['E2E_DB_HOST'] || '127.0.0.1',
    port: Number(process.env['E2E_DB_PORT'] || 3307),
    user: process.env['E2E_DB_USER'] || 'zenda',
    password: process.env['E2E_DB_PASSWORD'] || 'zenda_local_only',
    database: schema,
  });
  const [rows] = await database.query<mysql.RowDataPacket[]>(
    'SELECT name FROM students WHERE id = 1',
  );
  if (rows[0]?.['name'] !== 'Jessica John Jones')
    throw new Error('Refusing to reset a database without the synthetic demo student.');
});

test.beforeEach(async ({ page }) => {
  // Only the explicitly synthetic demonstration activation is reset. School/student/fee data is preserved.
  await database.execute('DELETE FROM activations WHERE student_id = 1');
  await page.goto('/');
  await expect(dashboardTrigger(page)).toBeVisible();
});
test.afterAll(async () => {
  await database?.end();
});

function dashboardTrigger(page: Page) {
  return page
    .getByLabel('School fee payment')
    .getByRole('button', { name: 'Activate Now', exact: true });
}
function submitButton(page: Page) {
  return page.getByRole('dialog').getByRole('button', { name: 'Activate Now', exact: true });
}

async function fillValid(page: Page) {
  await page.getByLabel('Phone Number', { exact: true }).fill('+91 98765-43210');
  await page.getByLabel('PAN Card Number', { exact: true }).fill('abcde1234f');
  await page.getByLabel('Name as in PAN Card', { exact: true }).fill('DEMO PARENT');
  await page.getByLabel('Email', { exact: true }).fill('parent@example.com');
  await page.getByLabel('Email', { exact: true }).blur();
}
async function capture(page: Page, name: string) {
  if (process.env['CAPTURE_EVIDENCE'] === '1') {
    await mkdir(evidence, { recursive: true });
    await page.screenshot({ path: resolve(evidence, name), fullPage: true });
  }
}

test('dashboard → validation → activation → reload @evidence', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Jessica John Jones' })).toBeVisible();
  await expect(page.getByText('₹3,40,000', { exact: true })).toBeVisible();
  await capture(page, '01-dashboard.png');
  await dashboardTrigger(page).click();
  await expect(page.getByLabel('Phone Number', { exact: true })).toBeFocused();
  await expect(submitButton(page)).toBeDisabled();
  await capture(page, '02-activation-form.png');
  await page.getByLabel('Phone Number', { exact: true }).fill('+91987654321');
  await page.getByLabel('Email', { exact: true }).fill('parent@example.org');
  await page.getByLabel('Phone Number', { exact: true }).blur();
  await page.getByLabel('Email', { exact: true }).blur();
  await expect(submitButton(page)).toBeDisabled();
  await expect(page.getByText('Enter +91 followed by exactly 10 digits.')).toBeVisible();
  await expect(page.getByText('Enter a valid email ending in .com.')).toBeVisible();
  await capture(page, '03-validation-errors.png');
  const [empty] = await database.query<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) AS count FROM activations WHERE student_id=1',
  );
  expect(empty[0]['count']).toBe(0);
  await fillValid(page);
  await expect(submitButton(page)).toBeEnabled();
  await expect(page.getByRole('img', { name: 'Phone Number is valid' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Email is valid' })).toBeVisible();
  await capture(page, '04-valid-details.png');
  await submitButton(page).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: /Activated/ })).toBeVisible();
  await capture(page, '05-activated-dashboard.png');
  const [saved] = await database.query<mysql.RowDataPacket[]>(
    'SELECT phone, pan, email FROM activations WHERE student_id = 1',
  );
  expect(saved).toHaveLength(1);
  expect(saved[0]['phone']).toBe('+919876543210');
  expect(saved[0]['pan']).toBe('ABCDE1234F');
  await page.reload();
  await expect(page.getByRole('button', { name: /Activated/ })).toBeVisible();
  await capture(page, '06-persisted-after-reload.png');
});

test('cancel, close, Escape and backdrop discard input, restore focus, and never write', async ({
  page,
}) => {
  const trigger = dashboardTrigger(page);
  for (const action of ['Cancel', 'Close', 'Escape', 'Backdrop']) {
    await trigger.click();
    await fillValid(page);
    if (action === 'Escape') await page.keyboard.press('Escape');
    else if (action === 'Backdrop') await page.mouse.click(8, 8);
    else
      await page
        .getByRole('button', {
          name: action === 'Close' ? 'Close activation form' : 'Cancel',
          exact: true,
        })
        .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
  const [rows] = await database.query<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) AS count FROM activations WHERE student_id=1',
  );
  expect(rows[0]['count']).toBe(0);
  await trigger.click();
  await expect(page.getByLabel('Phone Number', { exact: true })).toHaveValue('');
  await expect(submitButton(page)).toBeDisabled();
});

test('server failure preserves details and retry succeeds', async ({ page }) => {
  await dashboardTrigger(page).click();
  await fillValid(page);
  // Only the failure response is injected; the retry goes to the real API and MySQL.
  await page.route(
    '**/api/v1/students/1/activation',
    (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/problem+json',
        body: '{"detail":"Temporary failure"}',
      }),
    { times: 1 },
  );
  await submitButton(page).click();
  await expect(page.getByRole('alert')).toContainText('Unable to activate');
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('parent@example.com');
  await submitButton(page).click();
  await expect(page.getByRole('button', { name: /Activated/ })).toBeVisible();
});

test('dashboard request failure has a working retry', async ({ page }) => {
  await page.route('**/api/v1/students', (route) => route.fulfill({ status: 503, body: '{}' }), {
    times: 1,
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Unable to load');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('heading', { name: 'Jessica John Jones' })).toBeVisible();
});

test('native dialog traps focus and passes accessibility checks', async ({ page }) => {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await dashboardTrigger(page).click();
  await fillValid(page);
  await submitButton(page).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close activation form' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(submitButton(page)).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

for (const width of [320, 375, 1440]) {
  test(`dashboard and modal fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await dashboardTrigger(page).click();
    const box = await page.getByRole('dialog').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await fillValid(page);
    await expect(submitButton(page)).toBeInViewport();
  });
}
