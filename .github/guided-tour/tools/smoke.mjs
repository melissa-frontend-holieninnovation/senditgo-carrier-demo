import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { toSelector } from '../src/anchors.js';
import { tours } from '../src/tours/index.js';

const base = new URL(process.argv[2]);
assert(base.pathname.endsWith('/'), 'The Pages base URL must end with a slash.');
const rootSelector = '[data-senditgo-tour-root]';
const options = { viewport: { width: 1440, height: 790 }, locale: 'en-AU', timezoneId: 'Australia/Sydney', colorScheme: 'light' };
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });

function tourUrl(tour) {
  const route = tour.steps[0].route.replace(/^\//, '');
  const link = new URL(route ? route + '/' : '', base);
  link.searchParams.set('tour', tour.id);
  return link.href;
}

async function operationalData(page) {
  return page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) =>
    /^sg-v3-proto:(operations|regions|shifts|leaves|trays|unconfirmed):/.test(key))));
}

async function openTour(page, tour, first = 1) {
  const link = new URL(tourUrl(tour));
  if (first > 1) link.searchParams.set('step', String(first));
  const response = await page.goto(link.href, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, tour.id + ' entry');
  return page.locator(`${rootSelector}[data-tour="${tour.id}"]`);
}

async function walk(tour) {
  const context = await browser.newContext(options);
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    const writes = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin === base.origin && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.method() + ' ' + url.pathname);
    });
    const root = await openTour(page, tour);
    await root.locator('.sgt-tip--main:visible').waitFor();
    const before = await operationalData(page);
    let inspected;
    let factsSeen = false;
    for (const [index, step] of tour.steps.entries()) {
      const number = index + 1;
      const active = page.locator(`${rootSelector}[data-tour="${tour.id}"][data-step="${number}"][data-state="step"]`);
      await active.waitFor();
      const prompt = step.prompts[0];
      const main = active.getByRole('dialog');
      const target = page.locator(toSelector(prompt.target)).filter({ visible: true }).first();
      assert.equal(await main.getAttribute('aria-label'), `Tour step ${number} of ${tour.steps.length}`);
      assert.equal(await main.locator('.sgt-tip__text').innerText(), prompt.text.replaceAll('**', ''), tour.id + ' visible copy at ' + number);
      const route = new URL(page.url()).pathname.slice(base.pathname.length).replace(/\/$/, '');
      assert.equal('/' + route, step.route);
      await target.waitFor();

      if (toSelector(prompt.target).includes('pending-select-')) {
        const id = (await target.getAttribute('data-testid')).slice('pending-select-'.length);
        const checkbox = page.getByTestId('pending-check-' + id).getByRole('checkbox');
        inspected = { id, checked: await checkbox.isChecked() };
      }
      if (toSelector(prompt.target).includes('om-order-summary-')) {
        assert(inspected, 'Inspect an order before showing its facts');
        assert.equal(await target.getAttribute('data-testid'), 'om-order-summary-' + inspected.id);
        assert.equal(await page.getByTestId('pending-check-' + inspected.id).getByRole('checkbox').isChecked(), inspected.checked);
        assert.equal(await page.getByTestId('pending-select-' + inspected.id).getAttribute('aria-expanded'), 'true');
        assert.equal(await target.getByRole('columnheader', { name: 'SKU' }).count(), 1);
        assert.equal(await target.getByRole('columnheader', { name: 'Remaining qty' }).count(), 1);
        factsSeen = true;
      }

      const action = step.advanceOn === 'click' ? target : main.locator('[data-sgt="next"]');
      assert.equal(await action.evaluate((element) => element === document.activeElement), true, tour.id + ' keyboard focus at step ' + number);
      await page.keyboard.press('Enter');
    }
    await root.locator('.sgt-card--end').waitFor();
    assert.equal(await root.getByRole('heading').innerText(), tour.end.title);
    assert.deepEqual(await operationalData(page), before, tour.id + ' changed operational data');
    assert.deepEqual(writes, [], tour.id + ' sent a write request');
    if (tour.id === 'order-management') assert(factsSeen, 'OM must demonstrate inspection without selecting an order for dispatch');
    await root.getByRole('button', { name: 'Start again' }).click();
    await root.locator('.sgt-tip--main:visible').waitFor();
    await page.keyboard.press('Escape');
    await root.waitFor({ state: 'detached' });
    console.log(`${tour.id}: ${tour.steps.length} steps, end, restart and keyboard exit`);
  } finally {
    await context.close();
  }
}

async function checkReviewBranches() {
  const tour = tours.find((entry) => entry.id === 'order-management');
  const page = await browser.newPage(options);
  page.setDefaultTimeout(20_000);
  try {
    const root = await openTour(page, tour);
    await root.locator('.sgt-tip--main:visible').waitFor();
    const before = await operationalData(page);
    await page.getByTestId('rail-left-open').click();
    const queue = page.getByTestId('pending-section-toggle');
    await root.locator('[data-sgt="next"]:visible').waitFor();
    await queue.click();
    await root.locator('[data-sgt="next"]').click();
    const notice = root.locator('.sgt-card--unavailable');
    await notice.waitFor();
    assert.match(await notice.innerText(), /pending order/i);
    await notice.getByRole('button', { name: 'Continue' }).click();
    const map = tour.steps.findIndex((step) => step.prompts[0].target === 'om-view-toggle');
    await page.locator(`${rootSelector}[data-step="${map + 1}"][data-state="step"]`).waitFor();
    console.log('order-management: collapsed queue offers Continue and resumes at Map / List');

    await root.locator('[data-sgt="next"]').click();
    await page.getByTestId('rail-right-open').click();
    const practice = root.getByRole('group', { name: 'Practice selection' });
    await practice.waitFor();
    const retained = practice.getByRole('listitem').filter({ hasText: 'Example 01' });
    const unavailable = practice.getByRole('listitem').filter({ hasText: 'Example 02' });
    assert.match(await retained.innerText(), /Available/);
    assert.match(await unavailable.innerText(), /Assigned elsewhere/);
    await page.keyboard.press('Shift+Tab');
    const remove = practice.getByRole('button', { name: 'Remove from example' });
    assert(await remove.evaluate((button) => button === document.activeElement));
    await page.keyboard.press('Enter');
    await unavailable.waitFor({ state: 'detached' });
    assert.equal(await retained.count(), 1);
    assert.match(await practice.getByRole('status').innerText(), /Example 02 removed.*Example 01 is still selected/);
    await page.keyboard.press('Tab');
    assert(await root.locator('[data-sgt="next"]').evaluate((button) => button === document.activeElement));
    await page.keyboard.press('Enter');
    console.log('order-management: sample removal retains the available order and Next remains keyboard accessible');

    await page.getByTestId('om-view-toggle').getByRole('radio', { name: 'List' }).click();
    await page.getByTestId('om-runsheet-overview').waitFor();
    const openRail = page.getByTestId('rail-left-open');
    if (await openRail.isVisible()) await openRail.click();
    await page.getByTestId('runsheet-list').getByRole('button', { name: /free driver$/i }).first().click();
    await page.getByTestId('om-detail-idle').waitFor();
    await notice.waitFor();
    assert.match(await notice.innerText(), /no run sheet/i);
    await notice.getByRole('button', { name: 'Finish' }).click();
    await root.locator('.sgt-card--end').waitFor();
    assert.deepEqual(await operationalData(page), before, 'Practice or fallback changed operational data');
    console.log('order-management: idle-driver detail offers Finish');
  } finally {
    await page.close();
  }
}

try {
  for (const tour of tours) await walk(tour);
  await checkReviewBranches();
} finally {
  await browser.close();
}
