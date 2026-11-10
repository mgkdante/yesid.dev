<script setup>
import { computed, ref, watch, resolveComponent } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { roundTrip, setImageControl, imageFile, normalizeIds, pasteBlocks, componentError, sanitizeClipboardBlocks } from './data.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ value: Object, disabled: Boolean, folder: String });
const emit = defineEmits(['input']);
const api = useApi();
const editor = resolveComponent('interface-input-block-editor');
const picker = resolveComponent('v-upload');
const current = ref(normalizeIds(props.value));
const unavailable = componentError(editor, picker);
const error = ref('');
const editorKey = ref(0);
const clipboardType = 'application/x-yesid-article-blocks';
const images = computed(() => current.value?.blocks?.filter(b => b.type === 'image') ?? []);
watch(() => props.value, value => {
  if (value === null && props.disabled) return;
  current.value = normalizeIds(value);
});
function publish(value) {
  if (props.disabled || unavailable) return;
  current.value = value;
  emit('input', value);
}
function save(value) {
  try { publish(roundTrip(current.value, value)); }
  catch (cause) { error.value = cause.message; }
}
function control(id, name, value) { publish(setImageControl(current.value, id, name, value)); }
function selectLight(id, file) {
  error.value = '';
  if (!file) return;
  try { control(id, 'light', imageFile(file, api.defaults.baseURL)); }
  catch (cause) { error.value = cause.message; }
}
// Add provenance without interfering with Directus's ordinary clipboard formats.
function copy(event) {
  const selected = [...event.currentTarget.querySelectorAll('.ce-block--selected')].map(node => node.dataset.id);
  const blocks = current.value?.blocks.filter(block => selected.includes(block.id)) ?? [];
  if (blocks.some(block => block.type === 'image')) event.clipboardData?.setData(clipboardType, JSON.stringify(blocks));
}
function paste(event) {
  const raw = event.clipboardData?.getData(clipboardType);
  if (!raw || props.disabled || unavailable) return;
  try {
    const blocks = sanitizeClipboardBlocks(JSON.parse(raw));
    if (!blocks) return;
    const afterId = event.target.closest('.ce-block')?.dataset.id;
    event.preventDefault();
    event.stopPropagation();
    publish(pasteBlocks(current.value, blocks, afterId));
    editorKey.value++;
  } catch { error.value = 'Could not paste article blocks. Copy them again.'; }
}
</script>

<template>
  <div @copy.capture="copy" @paste.capture="paste">
    <p v-if="unavailable" role="alert">{{ unavailable }}</p>
    <template v-else>
    <component :key="editorKey" :is="editor" v-bind="$attrs" :value="current" :disabled="disabled" :folder="folder" @input="save" />
    <fieldset v-for="(image, index) in images" :key="image.id" :disabled="disabled" class="image-controls">
      <legend>Image {{ index + 1 }}: {{ image.data.file?.title || image.data.file?.name || 'Image options' }}</legend>
      <label>Layout
        <select aria-label="Layout" :value="image.data.layout || ''" @change="control(image.id, 'layout', $event.target.value)">
          <option value="">Normal</option>
          <option value="row">Row</option>
          <option value="beside">Beside next block</option>
        </select>
      </label>
      <div>Light version</div>
      <div v-if="image.data.variants?.light">
        {{ image.data.variants.light.title || image.data.variants.light.name || 'Light version selected' }}
        <button type="button" :disabled="disabled" @click="control(image.id, 'light', null)">Remove light version</button>
      </div>
      <component v-if="!disabled" :is="picker" :folder="folder" :multiple="false" from-library from-url
        accept="image/*" @input="selectLight(image.id, $event)" />
      <label><input type="checkbox" :checked="Boolean(image.data.showBothThemes)"
        :disabled="disabled || !image.data.variants?.light"
        @change="control(image.id, 'showBothThemes', $event.target.checked)" /> Show both themes</label>
    </fieldset>
    </template>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.image-controls { margin-top: 16px; padding: 16px; border: 1px solid var(--theme--border-color); border-radius: var(--theme--border-radius); display: grid; gap: 12px; }
legend { padding: 0 8px; }
select { margin-left: 12px; padding: 8px; color: var(--theme--foreground); background: var(--theme--background); border: 1px solid var(--theme--border-color); }
label { display: flex; align-items: center; gap: 8px; }
</style>
