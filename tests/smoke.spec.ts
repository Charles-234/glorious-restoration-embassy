import { test, expect, type ConsoleMessage, type Page, type Request } from '@playwright/test';

/**
 * Every public route. /admin is excluded on purpose (it is password gated).
 * Keep this list in sync with the sitemap in app/sitemap.xml/route.ts.
 */
export const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/ministries',
  '/sermons',
  '/events',
  '/gallery',
  '/livestream',
  '/branches',
  '/contact',
  '/give',
  '/donate',
  '/pastor',
  '/blog',
  '/search',
  '/privacy',
  '/terms',
  '/admin/login',
];

/** Pages we assert deeply on, rather than just checking the status code. */
const DEEP_ROUTES = ['/', '/sermons', '/events', '/gallery', '/contact'];

/**
 * next dev keeps an HMR websocket open, so networkidle never settles. Give the
 * client bundle a moment to hydrate instead - framer-motion reveals content
 * from opacity 0, so screenshotting or measuring too early reads a blank page.
 */
async function settle(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
}

/** Console errors, uncaught exceptions, and any 4xx/5xx or failed request. */
function watch(page: Page) {
  const errors: string[] = [];
  const failures: string[] = [];

  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r: Request) => failures.push(`${r.url()} ${r.failure()?.errorText ?? ''}`));
  page.on('response', (r) => {
    // A missing favicon is cosmetic and would otherwise fail every page.
    if (r.status() >= 400 && !r.url().includes('favicon')) failures.push(`${r.status()} ${r.url()}`);
  });

  return { errors, failures };
}

test.describe('routes', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} returns 200`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should return 200`).toBe(200);
      await expect(page.locator('body')).toBeVisible();
    });
  }

  test('an unknown route returns 404', async ({ page }) => {
    const response = await page.goto('/qa-route-that-does-not-exist');
    expect(response?.status()).toBe(404);
  });
});

test.describe('styling and layout', () => {
  for (const route of DEEP_ROUTES) {
    test(`${route} has CSS applied`, async ({ page }) => {
      await page.goto(route);
      await settle(page);

      // Regression guard: when a `next build` clobbers .next under a running
      // `next dev`, the HTML still renders but every CSS chunk 404s, leaving
      // pages unstyled (or blank, because framer-motion stays at opacity 0).
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg, 'body background must not be transparent - that means no stylesheet').not.toBe(
        'rgba(0, 0, 0, 0)'
      );

      const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
      expect(fontFamily, 'Tailwind base styles should set a body font').not.toBe('');
    });

    test(`${route} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await settle(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `page overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    });

    test(`${route} has no console errors or failed requests`, async ({ page }) => {
      const { errors, failures } = watch(page);
      await page.goto(route);
      await settle(page);
      expect(errors, errors.join('\n')).toHaveLength(0);
      expect(failures, failures.join('\n')).toHaveLength(0);
    });

    test(`${route} has no broken images`, async ({ page }) => {
      await page.goto(route);
      await settle(page);
      const broken = await page.evaluate(async () => {
        const images = Array.from(document.images);
        images.forEach((img) => {
          img.loading = 'eager';
        });

        return (await Promise.all(
          images.map(async (img) => {
            try {
              await img.decode();
              return null;
            } catch {
              return img.currentSrc || img.src;
            }
          })
        )).filter((src): src is string => src !== null);
      });
      expect(broken, `broken images: ${broken.join(', ')}`).toHaveLength(0);
    });
  }
});

test('images have alt text and links have accessible names', async ({ page }) => {
  await page.goto('/');
  await settle(page);

  const problems = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('alt')) out.push(`img without alt: ${img.getAttribute('src')}`);
    });
    document.querySelectorAll('a').forEach((a) => {
      const name = a.textContent?.trim() || a.getAttribute('aria-label') || '';
      if (!name) out.push(`link without an accessible name: ${a.getAttribute('href')}`);
    });
    return out;
  });

  expect(problems, problems.join('\n')).toHaveLength(0);
});