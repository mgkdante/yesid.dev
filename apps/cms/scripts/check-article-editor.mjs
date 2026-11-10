// Disposable local admin check. Never accepts a remote CMS origin.
// CMS_LOCAL_PASSWORD=... bun apps/cms/scripts/check-article-editor.mjs [--stock]
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { localOrigin, localFetch, allowsRequest } from './lib/article-editor-local.mjs';

const base = localOrigin(process.env.CMS_LOCAL_URL || 'http://localhost:8055');
const email = process.env.CMS_LOCAL_EMAIL || 'editor@example.com';
const password = process.env.CMS_LOCAL_PASSWORD;
assert(password, 'Set CMS_LOCAL_PASSWORD for the disposable local admin');
const stock = process.argv.includes('--stock');
const auth = await localFetch(base, '/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
}).then(r => r.json());
assert(auth.data?.access_token, 'Local login failed');
async function request(path, method = 'GET', body) {
  const response = await localFetch(base, path, { method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.data.access_token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert(response.ok, `${method} ${path}: ${response.status}`);
  return response.status === 204 ? null : response.json();
}
const collection = 'article_editor_local_probe';
const existing = await request('/collections');
assert(!existing.data.some(c => c.collection === collection), `Remove the previous local ${collection} probe before rerunning`);
await request('/collections', 'POST', { collection, schema: {}, meta: {}, fields: [
  { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
  { field: 'body', type: 'json', meta: { interface: stock ? 'input-block-editor' : 'article-block-editor' }, schema: {} },
] });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const file = { fileId: '11111111-1111-4111-8111-111111111111', fileURL: `${base}/files/11111111-1111-4111-8111-111111111111`, url: `data:image/png;base64,${png.toString('base64')}` };
const extras = { variants: { light: { ...file, fileId: '22222222-2222-4222-8222-222222222222' } }, layout: 'beside', showBothThemes: true, future: { preserve: 42 } };
await request(`/items/${collection}`, 'POST', { body: { blocks: [
  { id: 'imageProbe', type: 'image', data: { file, caption: 'Probe', withBorder: false, withBackground: false, stretched: false, ...extras } },
  { id: 'paragraph1', type: 'paragraph', data: { text: 'Before' } },
] } });
const browser = await chromium.launch({ headless: true });
let page;
try {
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/*', async route => {
    if (!allowsRequest(base, route.request().url())) return route.abort('blockedbyclient');
    try {
      const response = await route.fetch({ maxRedirects: 0 });
      if (response.status() >= 300 && response.status() < 400) return route.abort('blockedbyclient');
      await route.fulfill({ response });
    } catch {
      // Abort failed requests without logging Playwright's credential-bearing call details.
      await route.abort('failed').catch(() => {});
    }
  });
  await page.goto(`${base}/admin/login`);
  await page.getByRole('textbox').first().fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL('**/admin/content**');
  await page.goto(`${base}/admin/content/${collection}/1`);
  await page.locator('.ce-paragraph').waitFor();
  // Each full navigation of a fresh local instance can show this dialog.
  const skip = page.getByRole('button', { name: 'Skip', exact: true });
  await skip.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await skip.isVisible()) {
    await skip.click();
    await skip.waitFor({ state: 'hidden' });
  }
  await page.getByText('Before', { exact: true }).fill('After unrelated paragraph edit');
  await page.waitForTimeout(800); // Editor.js debounces saves.
  await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === `/items/${collection}/1` && r.request().method() === 'PATCH'),
    page.keyboard.press('Control+s'),
  ]);
  const { data } = await request(`/items/${collection}/1`);
  const image = data.body.blocks.find(b => b.type === 'image');
  assert.equal(data.body.blocks.find(b => b.type === 'paragraph').data.text, 'After unrelated paragraph edit');
  for (const [key, value] of Object.entries(extras)) {
    if (stock) assert.equal(image.data[key], undefined, `Stock unexpectedly preserved ${key}`);
    else assert.deepEqual(image.data[key], value, `Lost ${key}`);
  }
  console.log(`${stock ? 'Stock: DROP confirmed' : 'Extension: SURVIVE confirmed'}: variants.light, layout, showBothThemes, future`);
  if (!stock) {
    const remind = page.getByRole('button', { name: 'Remind Later', exact: true });
    if (await remind.isVisible()) await remind.click();
    await page.getByLabel('Layout', { exact: true }).selectOption('row');
    await page.getByLabel('Show both themes', { exact: true }).uncheck();
    const [upload] = await Promise.all([
      page.waitForResponse(r => new URL(r.url()).pathname === '/files' && r.request().method() === 'POST'),
      page.locator('input[type=file]').last().setInputFiles({ name: 'probe.light.png', mimeType: 'image/png', buffer: png }),
    ]);
    const uploaded = (await upload.json()).data;
    await page.waitForTimeout(800);
    await page.getByLabel('Show both themes', { exact: true }).check();
    await page.waitForTimeout(800);
    await Promise.all([
      page.waitForResponse(r => new URL(r.url()).pathname === `/items/${collection}/1` && r.request().method() === 'PATCH'),
      page.keyboard.press('Control+s'),
    ]);
    const updated = (await request(`/items/${collection}/1`)).data.body.blocks.find(b => b.type === 'image').data;
    assert.equal(updated.layout, 'row');
    assert.equal(updated.showBothThemes, true);
    assert.equal(updated.variants.light.fileId, uploaded.id);
    assert.equal(updated.variants.light.width, 1);
    assert.deepEqual(updated.future, extras.future);
    console.log('Controls: row, light upload, show both themes persisted');
    await page.locator('input[type=file]').last().setInputFiles({ name: 'invalid.light.svg', mimeType: 'image/svg+xml',
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>') });
    await page.getByRole('alert').filter({ hasText: 'Select a PNG, JPEG, WebP, GIF or AVIF image' }).waitFor();
    console.log('Picker: SVG refused with visible error');

    const secondExtras = { ...extras, layout: 'row', showBothThemes: false,
      variants: { light: { ...file, fileId: '33333333-3333-4333-8333-333333333333' } } };
    await request(`/items/${collection}/1`, 'PATCH', { body: { blocks: [
      { id: 'dup', type: 'image', data: { file, caption: 'First', ...extras } },
      { id: 'dup', type: 'image', data: { file, caption: 'Second', ...secondExtras } },
      { id: 'paragraph1', type: 'paragraph', data: { text: 'Duplicate probe' } },
    ] } });
    await page.reload();
    await page.getByText('Duplicate probe', { exact: true }).fill('Duplicate edit');
    await page.waitForTimeout(800);
    await Promise.all([
      page.waitForResponse(r => new URL(r.url()).pathname === `/items/${collection}/1` && r.request().method() === 'PATCH'),
      page.keyboard.press('Control+s'),
    ]);
    const duplicates = (await request(`/items/${collection}/1`)).data.body.blocks.filter(b => b.type === 'image');
    assert.notEqual(duplicates[0].id, duplicates[1].id);
    assert.deepEqual(duplicates[0].data.variants, extras.variants);
    assert.deepEqual(duplicates[1].data.variants, secondExtras.variants);
    assert.equal(duplicates[0].data.layout, 'beside');
    assert.equal(duplicates[1].data.layout, 'row');
    console.log('Duplicate IDs: unique IDs and separate metadata SURVIVE');
    await page.getByLabel('Layout', { exact: true }).nth(1).selectOption('beside');
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const blocks = document.querySelectorAll('.ce-block');
      blocks[1].classList.add('ce-block--selected');
      const clipboardData = new DataTransfer();
      blocks[1].dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData }));
      blocks[1].classList.remove('ce-block--selected');
      blocks[2].querySelector('[contenteditable]').dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData }));
    });
    await page.getByLabel('Layout', { exact: true }).nth(2).waitFor();
    await page.waitForTimeout(800);
    await Promise.all([
      page.waitForResponse(r => new URL(r.url()).pathname === `/items/${collection}/1` && r.request().method() === 'PATCH'),
      page.keyboard.press('Control+s'),
    ]);
    const copies = (await request(`/items/${collection}/1`)).data.body.blocks.filter(b => b.type === 'image');
    assert.equal(copies.length, 3);
    assert.equal(new Set(copies.map(b => b.id)).size, 3);
    assert.deepEqual(copies[2].data.variants, secondExtras.variants);
    assert.equal(copies[2].data.layout, 'beside');
    assert.equal(copies[2].data.showBothThemes, false);
    assert.equal(copies[0].data.layout, 'beside');
    console.log('Copy/paste: unique ID, source pair, layout, showBothThemes SURVIVE (same file, different settings)');

  }
} finally {
  await page?.unrouteAll({ behavior: 'wait' });
  await browser.close();
  await request(`/collections/${collection}`, 'DELETE');
}
