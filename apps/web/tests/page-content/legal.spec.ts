import { test, expect } from '@playwright/test';

// OPS1 legal framework (launch Phase 1): 5 CMS-backed pages under /legal/,
// EN + FR, linked from the footer, rendered through BlockRenderer.

const LEGAL_SLUGS = ['privacy', 'terms', 'cookies', 'accessibility', 'notice'];

// OPS2: Privacy and Cookies disclose consented Plausible analytics in all three locales.
const ANALYTICS_LEGAL_EXPECTATIONS = [
  {
    route: '/legal/privacy',
    locale: 'EN',
    page: 'Privacy',
    clause:
      "and four conversion events: a successful contact-form submission, a click to book a call, a click on a direct contact channel, and a click to inspect a project's live site or public source repository. I do not attach contact-form fields, destination URLs, link labels, or custom properties to those events.",
    revision: 'Last updated: 2026-07-11',
  },
  {
    route: '/fr/legal/privacy',
    locale: 'FR',
    page: 'Privacy',
    clause:
      'ainsi que quatre événements de conversion : l’envoi réussi du formulaire de contact, le clic pour réserver un appel, le clic sur un moyen de contact direct et le clic pour consulter le site en ligne ou le dépôt public de code source d’un projet. Je ne joins à ces événements aucun champ du formulaire de contact, aucune URL de destination, aucune étiquette de lien ni aucune propriété personnalisée.',
    revision: 'Dernière mise à jour : 2026-07-11',
  },
  {
    route: '/es/legal/privacy',
    locale: 'ES',
    page: 'Privacy',
    clause:
      'y cuatro eventos de conversión: el envío exitoso del formulario de contacto, el clic para reservar una llamada, el clic en un canal de contacto directo y el clic para consultar el sitio publicado o el repositorio público de código fuente de un proyecto. No adjunto a esos eventos ningún campo del formulario de contacto, URL de destino, etiqueta de enlace ni propiedad personalizada.',
    revision: 'Última actualización: 2026-07-11',
  },
  {
    route: '/legal/cookies',
    locale: 'EN',
    page: 'Cookies',
    clause:
      "and four conversion events: a successful contact-form submission, a click to book a call, a click on a direct contact channel, and a click to inspect a project's live site or public source repository. I do not attach contact-form fields, destination URLs, link labels, or custom properties to those events.",
    revision: 'Last updated: 2026-07-11',
  },
  {
    route: '/fr/legal/cookies',
    locale: 'FR',
    page: 'Cookies',
    clause:
      'ainsi que quatre événements de conversion : l’envoi réussi du formulaire de contact, le clic pour réserver un appel, le clic sur un moyen de contact direct et le clic pour consulter le site en ligne ou le dépôt public de code source d’un projet. Je ne joins à ces événements aucun champ du formulaire de contact, aucune URL de destination, aucune étiquette de lien ni aucune propriété personnalisée.',
    revision: 'Dernière mise à jour : 2026-07-11',
  },
  {
    route: '/es/legal/cookies',
    locale: 'ES',
    page: 'Cookies',
    clause:
      'y cuatro eventos de conversión: el envío exitoso del formulario de contacto, el clic para reservar una llamada, el clic en un canal de contacto directo y el clic para consultar el sitio publicado o el repositorio público de código fuente de un proyecto. No adjunto a esos eventos ningún campo del formulario de contacto, URL de destino, etiqueta de enlace ni propiedad personalizada.',
    revision: 'Última actualización: 2026-07-11',
  },
] as const;

test.describe('/legal pages content', () => {
  test('all five legal pages return 200 with a non-empty body', async ({ page }) => {
    for (const slug of LEGAL_SLUGS) {
      const response = await page.goto(`/legal/${slug}`);
      expect(response?.status(), `/legal/${slug} status`).toBe(200);
      await expect(page.locator('[data-testid="page-legal"]')).toBeVisible();
      const paragraphs = page.locator('[data-testid="legal-body"] p');
      expect(await paragraphs.count(), `/legal/${slug} paragraphs`).toBeGreaterThan(2);
    }
  });

  test('privacy renders EN title and the privacy-officer commitment', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('h1')).toHaveText('Privacy Policy');
    await expect(page.locator('[data-testid="legal-body"]')).toContainText('Privacy Officer');
    await expect(page.locator('[data-testid="legal-body"]')).toContainText('admin@yesid.dev');
  });

  test('privacy renders FR title and French body under /fr', async ({ page }) => {
    await page.goto('/fr/legal/privacy');
    await expect(page.locator('h1')).toHaveText('Politique de confidentialité');
    await expect(page.locator('[data-testid="legal-body"]')).toContainText(
      'renseignements personnels',
    );
  });

  test('footer links to the legal pages', async ({ page }) => {
    await page.goto('/');
    const privacyLink = page.locator('footer a[href="/legal/privacy"]');
    await expect(privacyLink).toBeVisible();
    await privacyLink.click();
    await page.waitForURL('/legal/privacy');
    await expect(page.locator('[data-testid="page-legal"]')).toBeVisible();
  });

  test('unknown legal slug 404s', async ({ page }) => {
    const response = await page.goto('/legal/nope');
    expect(response?.status()).toBe(404);
  });

  test('Privacy and Cookies name Plausible and disclose opt-in in EN, FR, and ES', async ({ page }) => {
    for (const { route } of ANALYTICS_LEGAL_EXPECTATIONS) {
      await page.goto(route);
      const body = page.locator('[data-testid="legal-body"]');
      await expect(body).toContainText('Plausible');
      await expect(body).not.toContainText('Umami');
    }

    await page.goto('/legal/cookies');
    await expect(page.locator('[data-testid="legal-body"]')).toContainText('off until you allow it');
    await page.goto('/fr/legal/cookies');
    await expect(page.locator('[data-testid="legal-body"]')).toContainText('désactivé tant que vous ne l’autorisez pas');
    await page.goto('/es/legal/cookies');
    await expect(page.locator('[data-testid="legal-body"]')).toContainText('desactivado hasta que usted lo autorice');
  });

  for (const expectation of ANALYTICS_LEGAL_EXPECTATIONS) {
    test(`${expectation.page} renders the exact ${expectation.locale} four-event disclosure and revision`, async ({
      page,
    }) => {
      await page.goto(expectation.route);
      const body = page.locator('[data-testid="legal-body"]');
      await expect(body).toContainText(expectation.clause);
      await expect(body).toContainText(expectation.revision);
    });
  }
});
