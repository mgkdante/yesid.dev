import { defineInterface } from '@directus/extensions-sdk';
import component from './interface.vue';

export default defineInterface({
  id: 'article-block-editor',
  name: 'Article Block Editor',
  description: 'Block Editor with image layouts and light versions',
  icon: 'article', types: ['json'], group: 'standard', component,
  options: [
    { field: 'placeholder', type: 'string', meta: { interface: 'input' } },
    { field: 'font', type: 'string', schema: { default_value: 'sans-serif' }, meta: {
      interface: 'select-dropdown', options: { choices: ['sans-serif', 'monospace', 'serif'].map(value => ({ text: value, value })) },
    } },
    { field: 'tools', type: 'json', schema: { default_value: ['header', 'nestedlist', 'code', 'image', 'paragraph', 'checklist', 'quote', 'underline'] }, meta: {
      interface: 'select-multiple-dropdown', options: { choices: ['header', 'nestedlist', 'embed', 'paragraph', 'code', 'image', 'attaches', 'table', 'quote', 'delimiter', 'underline', 'inlinecode', 'marker', 'checklist', 'toggle', 'alignment', 'raw'].map(value => ({ text: value, value })) },
    } },
    { field: 'bordered', type: 'boolean', schema: { default_value: true }, meta: { interface: 'boolean' } },
    { field: 'folder', type: 'uuid', meta: { interface: 'system-folder' } },
  ],
});
