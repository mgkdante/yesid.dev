// The stock image tool rebuilds its data object. Restore extras by block ID,
// never by position, so moving or deleting images cannot transfer metadata.
export function roundTrip(previous, saved) {
  if (!saved) return null;
  assertUniqueIds(previous);
  const images = new Map((previous?.blocks ?? []).filter(b => b.type === 'image').map(b => [b.id, b.data]));
  return { ...saved, blocks: saved.blocks.map(block => block.type === 'image'
    ? { ...block, data: { ...images.get(block.id), ...block.data } }
    : block) };
}

export function setImageControl(document, id, control, value) {
  assertUniqueIds(document);
  return { ...document, blocks: document.blocks.map(block => {
    if (block.id !== id || block.type !== 'image') return block;
    const data = { ...block.data };
    if (control === 'layout') {
      if (value === 'row' || value === 'beside') data.layout = value;
      else delete data.layout;
    } else if (control === 'light') {
      data.variants = { ...data.variants };
      if (value) data.variants.light = value;
      else {
        delete data.variants.light;
        data.showBothThemes = false;
      }
    } else if (control === 'showBothThemes') {
      data.showBothThemes = Boolean(value && data.variants?.light);
    }
    return { ...block, data };
  }) };
}

// IDs must be normalized before Editor.js sees the document, including paragraphs.
export function normalizeIds(document) {
  if (!document) return document;
  const reserved = new Set(document.blocks.map(block => block.id).filter(Boolean));
  const seen = new Set();
  return { ...document, blocks: document.blocks.map(block => {
    let id = block.id;
    if (!id || seen.has(id)) {
      do { id = crypto.randomUUID(); } while (reserved.has(id));
      reserved.add(id);
    }
    seen.add(id);
    return { ...block, id };
  }) };
}

function assertUniqueIds(document) {
  const ids = (document?.blocks ?? []).map(block => block.id);
  if (ids.some(id => !id) || new Set(ids).size !== ids.length) {
    throw new Error('Article editor requires unique block IDs. Reload the field.');
  }
}

const isDim = value => Number.isInteger(value) && value > 0 && value <= 16000;
const isText = value => typeof value === 'string' && value.length > 0;

/** A file object as the site expects it, or null when it is unusable. */
function cleanFile(file) {
  if (!file || typeof file !== 'object' || !isText(file.fileId) || !isText(file.url)) return null;
  const width = file.width ?? undefined;
  const height = file.height ?? undefined;
  if ((width !== undefined || height !== undefined) && !(isDim(width) && isDim(height))) return null;
  const out = { fileId: file.fileId, fileURL: isText(file.fileURL) ? file.fileURL : '', url: file.url };
  if (width !== undefined) Object.assign(out, { width, height });
  if (typeof file.size === 'string' || (typeof file.size === 'number' && Number.isFinite(file.size))) out.size = String(file.size);
  for (const key of ['name', 'extension', 'title']) if (typeof file[key] === 'string') out[key] = file[key];
  return out;
}

/**
 * Clipboard payloads come from outside this field, so they are untrusted.
 * Returns sanitized copies, or null when an image's main file is unusable
 * (the caller then lets the ordinary paste path handle the clipboard).
 * Invalid layout, theme or light-version metadata is dropped, never kept.
 */
export function sanitizeClipboardBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  const clean = [];
  for (const block of blocks) {
    if (!block || typeof block.type !== 'string' || !block.data || typeof block.data !== 'object' || Array.isArray(block.data)) return null;
    const { layout, showBothThemes, variants, ...data } = block.data;
    if (block.type !== 'image') { clean.push({ ...block, data }); continue; }
    const file = cleanFile(data.file);
    if (!file) return null;
    const out = { ...data, file };
    if (layout === 'row' || layout === 'beside') out.layout = layout;
    const light = cleanFile(variants?.light);
    if (light) out.variants = { light };
    if (light && typeof showBothThemes === 'boolean') out.showBothThemes = showBothThemes;
    clean.push({ ...block, data: out });
  }
  return clean;
}

// Explicit clipboard provenance: clone selected blocks, never infer from a file ID.
export function pasteBlocks(document, blocks, afterId) {
  const copies = blocks.map(block => ({ ...block, id: crypto.randomUUID() }));
  const existing = document?.blocks ?? [];
  const index = afterId ? existing.findIndex(block => block.id === afterId) + 1 : existing.length;
  return normalizeIds({ ...document, blocks: [...existing.slice(0, index), ...copies, ...existing.slice(index)] });
}

export function componentError(editor, picker) {
  return typeof editor === 'string' || typeof picker === 'string' || !editor || !picker
    ? 'Article editor unavailable: required Directus editor or upload component could not be loaded. Reload or contact the administrator.' : '';
}

export function imageFile(file, baseURL = '/') {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
    throw new Error('Select a PNG, JPEG, WebP, GIF or AVIF image for the light version.');
  }
  if (![file.width, file.height].every(value => Number.isInteger(value) && value > 0 && value <= 16000)
    || file.width * file.height > 40000000 || typeof file.id !== 'string' || !file.id) {
    throw new Error('Select an image with valid dimensions, up to 16000 pixels per side and 40 million pixels.');
  }
  const base = baseURL.replace(/\/?$/, '/');
  const result = { fileId: file.id, fileURL: `${base}files/${file.id}`, url: `${base}assets/${file.id}`,
    width: file.width, height: file.height };
  if (typeof file.filesize === 'string' || (typeof file.filesize === 'number' && Number.isFinite(file.filesize))) result.size = String(file.filesize);
  if (typeof file.filename_download === 'string') {
    result.name = file.filename_download;
    result.extension = file.filename_download.split('.').pop();
  }
  if (typeof file.title === 'string') result.title = file.title;
  return result;
}
