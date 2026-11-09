import { alignTarget, measurePosition, planRestore, type RestorePlan, type SectionBox } from './reading-position-plan';

export interface ReadingSection {
	/** A live measurement of this same section, including after an awaited reveal. */
	readonly box: SectionBox;
	readonly revealId?: string;
}

export interface DetailReadingPorts {
	sections(): ReadingSection[];
	viewportHeight(): number;
	scrollY(): number;
	scrollTo(y: number): void;
	departureY(): number | undefined;
	bulkExpanded(): boolean;
	jump?: (id: string) => Promise<unknown>;
	/** Follow these sections until reader input or the returned stop is called. */
	follow(targets: ReadingSection[], onLayout: () => void): () => void;
}

class DetailReading {
	private request = 0;
	private stopFollowing = () => {};
	constructor(private ports: DetailReadingPorts) {}
	dispose = (): void => {
		this.request++;
		this.stopFollowing();
	};
	capture = (): unknown => {
		const y = this.ports.departureY() ?? this.ports.scrollY();
		return measurePosition({
			sections: this.ports.sections().map((section) => section.box),
			viewportHeight: this.ports.viewportHeight(), y, bulkExpanded: this.ports.bulkExpanded(),
		});
	};
	restore = (saved: unknown): void | Promise<void> => this.restoreFor(saved, 'locale');
	restoreHistory = (saved: unknown): void | Promise<void> => this.restoreFor(saved, 'history');
	private restoreFor(saved: unknown, reason: 'history' | 'locale'): void | Promise<void> {
		const current = { sectionCount: 0, bulkExpanded: this.ports.bulkExpanded(), canReveal: !!this.ports.jump };
		if (reason === 'history' && planRestore(saved, current, reason).kind === 'native') return;
		this.dispose();
		const sections = this.ports.sections();
		return this.apply(planRestore(saved, { ...current, sectionCount: sections.length }, reason), sections);
	}
	private async apply(plan: RestorePlan, sections: ReadingSection[]): Promise<void> {
		if (plan.kind === 'native' || plan.kind === 'stay') return;
		if (plan.kind === 'offset') { this.ports.scrollTo(plan.y); return; }
		const current = this.request;
		const target = sections[plan.index];
		if (plan.reveal && this.ports.jump) {
			const id = target.revealId;
			if (id) await this.ports.jump(id);
			if (current !== this.request) return;
		}
		const align = () => this.ports.scrollTo(alignTarget(
			target.box, plan.progress, this.ports.scrollY(), this.ports.viewportHeight(),
		));
		align();
		this.stopFollowing = this.ports.follow(sections, align);
	}
}

/** Locale and history restoration share the same cancellable detail strategy. */
export function createDetailReading(ports: DetailReadingPorts) {
	return new DetailReading(ports);
}
