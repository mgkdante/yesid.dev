import { parseArgs } from 'node:util';

type ProductionTarget = 'dev' | 'prod';

function optionCount(argv: readonly string[], option: string): number {
	return argv.filter(
		(argument) => argument === option || argument.startsWith(`${option}=`),
	).length;
}

export function parseProductionWriteCli(
	argv: readonly string[],
	label: string,
	requiredConfirmation: string,
): { target: ProductionTarget; apply: boolean } {
	const unknown = argv.find(
		(argument, index) =>
			!['--target', '--confirm'].includes(argv[index - 1] ?? '') &&
			argument !== '--apply' &&
			argument !== '--dry-run' &&
			argument !== '--target' &&
			!argument.startsWith('--target=') &&
			argument !== '--confirm' &&
			!argument.startsWith('--confirm='),
	);
	if (unknown) throw new Error(`[${label}] unknown argument: ${unknown}`);
	if (optionCount(argv, '--target') !== 1) {
		throw new Error(`[${label}] required: --target=dev|prod`);
	}
	for (const flag of ['--apply', '--dry-run']) {
		if (argv.filter((argument) => argument === flag).length > 1) {
			throw new Error(`[${label}] use at most one ${flag}`);
		}
	}
	if (optionCount(argv, '--confirm') > 1) {
		throw new Error(`[${label}] use at most one --confirm=<phrase>`);
	}
	const { values } = parseArgs({
		args: [...argv],
		options: {
			target: { type: 'string' },
			apply: { type: 'boolean', default: false },
			'dry-run': { type: 'boolean', default: false },
			confirm: { type: 'string' },
		},
		strict: true,
		allowPositionals: false,
	});
	if (values.target !== 'dev' && values.target !== 'prod') {
		throw new Error(`[${label}] required: --target=dev|prod`);
	}
	const apply = values.apply === true;
	if (apply && values['dry-run'] === true) {
		throw new Error(`[${label}] choose one: --dry-run or --apply`);
	}
	requireProductionWriteConfirmation(
		values.target === 'prod',
		apply,
		values.confirm,
		requiredConfirmation,
		label,
	);
	return { target: values.target, apply };
}

export function parseProductionOnlyWriteCli<TUrl extends string>(
	argv: readonly string[],
	label: string,
	requiredConfirmation: string,
	configuredUrl: string | undefined,
	productionUrl: TUrl,
): { apply: boolean; directusUrl: TUrl } {
	if (optionCount(argv, '--target') !== 1) {
		throw new Error(`[${label}] required: exactly one --target=prod`);
	}
	const { target, apply } = parseProductionWriteCli(
		argv,
		label,
		requiredConfirmation,
	);
	if (target !== 'prod') throw new Error(`[${label}] supports only --target=prod`);
	const normalizedUrl = (configuredUrl ?? productionUrl).replace(/\/+$/, '');
	if (normalizedUrl !== productionUrl) {
		throw new Error(`[${label}] Unsupported PUBLIC_DIRECTUS_URL: ${normalizedUrl}`);
	}
	return { apply, directusUrl: productionUrl };
}

function requireProductionWriteConfirmation(
	production: boolean,
	write: boolean,
	confirmation: string | undefined,
	required: string,
	label: string,
): void {
	if (production && write) {
		if (confirmation !== required) {
			throw new Error(`[${label}] PROD apply requires --confirm=${required}`);
		}
	} else if (confirmation !== undefined) {
		throw new Error(`[${label}] --confirm is accepted only for PROD apply`);
	}
}

export function requireExactAcknowledgement<T>(
	actual: T,
	required: T,
	error: string,
): void {
	if (!Object.is(actual, required)) throw new Error(error);
}
