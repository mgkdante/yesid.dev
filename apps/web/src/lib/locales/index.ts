import type { Locale } from '#lib/types.ts';
import { en } from './en';
import { fr } from './fr';
import { es } from './es';

export const localeCopy = { en, fr, es } satisfies Record<Locale, typeof en>;
