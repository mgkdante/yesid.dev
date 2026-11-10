// The stock image tool rebuilds its data object. Restore extras by block ID,
// never by position, so moving or deleting images cannot transfer metadata.
export function roundTrip(previous, saved) {
  if (!saved) return null;
  const images = new Map((previous?.blocks ?? []).filter(b => b.type === 'image').map(b => [b.id, b.data]));
  return { ...saved, blocks: saved.blocks.map(block => block.type === 'image'
    ? { ...block, data: { ...images.get(block.id), ...block.data } }
    : block) };
}

export function setImageControl(document, id, control, value) {
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

export function imageFile(file, baseURL) {
  const base = baseURL.replace(/\/?$/, '/');
  return {
    fileId: file.id, fileURL: `${base}files/${file.id}`, url: `${base}assets/${file.id}`,
    width: file.width, height: file.height, size: file.filesize,
    name: file.filename_download, title: file.title,
    extension: file.filename_download?.split('.').pop(),
  };
}
