<script setup>
import { computed, ref, watch, resolveComponent } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { roundTrip, setImageControl, imageFile } from './data.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({ value: Object, disabled: Boolean, folder: String });
const emit = defineEmits(['input']);
const api = useApi();
const editor = resolveComponent('interface-input-block-editor');
const picker = resolveComponent('v-upload');
const current = ref(props.value);
const error = ref('');
const images = computed(() => current.value?.blocks?.filter(b => b.type === 'image') ?? []);
watch(() => props.value, value => {
  if (value === null && props.disabled) return;
  current.value = value;
});
function publish(value) {
  if (props.disabled) return;
  current.value = value;
  emit('input', value);
}
function save(value) { publish(roundTrip(current.value, value)); }
function control(id, name, value) { publish(setImageControl(current.value, id, name, value)); }
function selectLight(id, file) {
  error.value = '';
  if (!file) return;
  if (!file.type?.startsWith('image/')) {
    error.value = 'Select an image for the light version.';
    return;
  }
  control(id, 'light', imageFile(file, api.defaults.baseURL));
}
</script>

<template>
  <div>
    <component :is="editor" v-bind="$attrs" :value="current" :disabled="disabled" :folder="folder" @input="save" />
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
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.image-controls { margin-top: 16px; padding: 16px; border: 1px solid var(--theme--border-color); border-radius: var(--theme--border-radius); display: grid; gap: 12px; }
legend { padding: 0 8px; }
select { margin-left: 12px; padding: 8px; color: var(--theme--foreground); background: var(--theme--background); border: 1px solid var(--theme--border-color); }
label { display: flex; align-items: center; gap: 8px; }
</style>
