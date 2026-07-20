import { configureUi, type ConfigureUiResult } from '@yesid/ui/cn';

/** Lock the product's class vocabulary before the first UI primitive renders. */
export function initializeUi(): ConfigureUiResult {
	return configureUi();
}
