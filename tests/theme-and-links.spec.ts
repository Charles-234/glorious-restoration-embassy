import { test, expect } from '@playwright/test';

/** Light and dark are the only two themes this site ships. */
const THEMES = [
  { name: 'light', token: 'rgb(249, 247, 243)' },
  { name: 'dark', token: 'rgb(11, 18, 34)' },
] as const;

const THEME_ROUTES = ['/', '/sermons', '/gallery', '/contact'];

async function applyTheme(page: import('@playwright/test').Page, theme: string) {
  // next-themes reads this key, and it has to exist before hydration.
  await page.addInitScript((t) => {
    window.localStorage.setItem('theme', t);
  }, theme);
}

test.describe('theming', () => {
  for (const theme of THEMES) {
    for (const route of THEME_ROUTES) {
      test(`${route} renders correctly in ${theme.name}`, async ({ page }) => {
        await applyTheme(page, theme.name);
        await page.goto(route);
        await page.waitForLoadState('load');
        await page.waitForTimeout(800);

        await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme.name}\\b`));

        const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        expect(bg, `${route} in ${theme.name} should use --background`).toBe(theme.token);

        // Nothing should stay invisible: framer-motion animates from opacity 0.
        const invisible = await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>('body h1, body h2, body p'))
            .filter((el) => {
              const s = getComputedStyle(el);
              return Number(s.opacity) < 0.2 && el.textContent?.trim().length > 0;
            })
            .map((el) => el.textContent?.trim().slice(0, 60))
        );
        expect(invisible, `invisible text in ${theme.name}: ${invisible.join(' | ')}`).toHaveLength(0);
      });
    }
  }
});

test.describe('internal links', () => {
  const LINK_SOURCES = ['/', '/about', '/ministries', '/sermons', '/events', '/branches', '/contact'];

  test('every internal link on the site resolves', async ({ page, request }) => {
    // Crawling 12 pages plus every link on them is slow against a dev server,
    // especially while routes are still being compiled on first hit.
    test.setTimeout(180_000);

    const checked = new Set<string>();
    const dead: string[] = [];

    for (const source of LINK_SOURCES) {
      await page.goto(source);
      await page.waitForLoadState('load');

      const hrefs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href]'))
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((href) => href.startsWith(window.location.origin))
      );

      for (const href of hrefs) {
        const url = new URL(href);
        const key = `${url.pathname}${url.search}`;
        if (checked.has(key)) continue;
        checked.add(key);

        const response = await request.get(href);
        if (response.status() >= 400) dead.push(`${response.status()} ${key}`);
      }
    }

    expect(dead, `dead internal links:\n${dead.join('\n')}`).toHaveLength(0);
    expect(checked.size, 'the crawler should have found links to check').toBeGreaterThan(5);
  });
});

test.describe('SEO plumbing', () => {
  test('sitemap.xml is valid and lists the public routes', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const xml = await response.text();
    expect(xml).toContain('<urlset');

    for (const route of ['/sermons', '/events', '/contact', '/give', '/privacy', '/terms']) {
      expect(xml, `sitemap is missing ${route}`).toMatch(new RegExp(`<loc>[^<]*${route}</loc>`));
    }
  });

  test('robots.txt is served and references the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('User-agent');
    expect(body).toContain('Sitemap:');
  });

  test('the canonical domain is declared in metadata', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical, 'every page should declare a canonical URL').toBeTruthy();
  });
});