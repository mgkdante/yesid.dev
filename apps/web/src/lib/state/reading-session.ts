import { makeBlob, parseBlob, serializeBlob, type FocusSnapshot, type HandoffBlob } from './handoff-blob';

export interface ScrollContext {
	capture: () => unknown;
	restore: (snapshot: unknown) => void | Promise<void>;
}
export interface NavigationIntent {
	type: string;
	fromPath?: string;
	toPath?: string;
	shallow: boolean;
	willUnload: boolean;
	event?: unknown;
	complete?: Promise<unknown>;
}
export interface SessionPorts {
	history: {
		suppressAnchoring(): () => void;
		pendingDiagrams(): boolean;
		onLayoutChange(cb: () => void): () => void;
		onReaderInput(cb: () => void): () => void;
		frame(cb: () => void): () => void;
	};
	scrollY(): number;
	scrollTo(y: number): void;
	store: { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void };
	focus: { capture(): FocusSnapshot | null; restore(focus: FocusSnapshot | null): void };
	afterPaint(): Promise<void>;
	now(): number;
	stableIdentity(): string | undefined;
	setRestoring(value: boolean): void;
	/** Application routing policy stays in the browser adapter. */
	routing: {
		key(path: string, identity?: string): string;
		isHandoff(from: string, to: string, identity?: string): boolean;
		isSwitch(from: string, to: string): boolean;
	};
}

export interface ReadingSession {
	dispose(): void;
	activate(event: object): void;
	before(nav: NavigationIntent): void;
	after(nav: NavigationIntent): Promise<void>;
	register(context: ScrollContext): () => void;
	departureY(): number | undefined;
	readonly restoring: boolean;
}

/** Keeps Kit's restored offset free of native anchor compensation until SVG layout settles. */
class HistoryLease {
	private cancelFrame = () => {};
	private stopLayout = () => {};
	private stopInput: () => void;
	private restore: () => void;
	private finished = false;
	constructor(private history: SessionPorts['history'], private released: () => void) {
		this.restore = history.suppressAnchoring();
		this.stopInput = history.onReaderInput(() => this.finish());
	}
	after(): void {
		if (this.finished) return;
		this.stopLayout();
		this.stopLayout = this.history.onLayoutChange(() => this.settle());
		this.settle();
	}
	private settle(): void {
		this.cancelFrame();
		if (this.finished || this.history.pendingDiagrams()) return;
		// Let the final SVG layout paint with anchoring still suppressed.
		this.cancelFrame = this.history.frame(() => {
			this.cancelFrame = this.history.frame(() => {
				if (!this.history.pendingDiagrams()) this.finish();
			});
		});
	}
	finish(): void {
		if (this.finished) return;
		this.finished = true;
		this.stopLayout();
		this.cancelFrame();
		this.restore();
		this.stopInput();
		this.released();
	}
}

class Session implements ReadingSession {
	private historyLease: HistoryLease | undefined;
	private activationOffsets = new WeakMap<object, number>();
	private navigationCapture: { y: number } | undefined;
	private context: ScrollContext | null = null;
	private activeSwitchKey: string | null = null;
	private activeStableIdentity: string | null = null;
	private restoringState = false;

	constructor(private ports: SessionPorts) {}
	get restoring(): boolean { return this.restoringState; }
	departureY(): number | undefined { return this.navigationCapture?.y; }
	activate(event: object): void { this.activationOffsets.set(event, this.ports.scrollY()); }
	register(context: ScrollContext): () => void {
		this.context = context;
		return () => { if (this.context === context) this.context = null; };
	}
	private setRestoring(value: boolean): void {
		this.restoringState = value;
		this.ports.setRestoring(value);
	}
	private identity(): string | undefined { return this.ports.stableIdentity()?.trim() || undefined; }
	private captureDeparture(nav: NavigationIntent): void {
		this.navigationCapture = undefined;
		if (nav.shallow || nav.willUnload) return;
		const event = nav.event;
		const y = event !== null && typeof event === 'object' ? this.activationOffsets.get(event) : undefined;
		const captured = { y: y ?? this.ports.scrollY() };
		this.navigationCapture = captured;
		const clear = () => { if (this.navigationCapture === captured) this.navigationCapture = undefined; };
		void nav.complete?.then(clear, clear);
	}
	before(nav: NavigationIntent): void {
		this.captureDeparture(nav);
		this.dispose();
		if (nav.type === 'popstate') {
			this.historyLease = new HistoryLease(this.ports.history, () => { this.historyLease = undefined; });
		}
		if (nav.shallow && nav.type === 'goto') return;
		if (nav.fromPath === undefined || nav.toPath === undefined) return;
		if (this.restoringState) return;
		this.activeSwitchKey = null;
		this.activeStableIdentity = null;
		const identity = this.identity();
		if (!this.ports.routing.isHandoff(nav.fromPath, nav.toPath, identity)) return;
		this.activeSwitchKey = this.ports.routing.key(nav.fromPath, identity);
		this.activeStableIdentity = identity ?? null;
		const now = this.ports.now();
		this.writeBlob(makeBlob({ path: this.activeSwitchKey,
			scroll: this.context ? this.context.capture() : { kind: 'offset', y: this.ports.scrollY() },
			focus: this.ports.focus.capture(), ts: now }));
		this.setRestoring(true);
	}
	async after(nav: NavigationIntent): Promise<void> {
		this.historyLease?.after();
		if (nav.shallow && nav.type === 'goto') return;
		if (nav.type === 'enter') return;
		if (nav.fromPath === undefined || nav.toPath === undefined) return;
		if (!this.activeSwitchKey && !this.ports.routing.isSwitch(nav.fromPath, nav.toPath)) {
			if (this.restoringState) this.setRestoring(false);
			return;
		}
		const scope = this.activeSwitchKey ?? this.ports.routing.key(nav.toPath);
		if (this.activeStableIdentity && this.identity() !== this.activeStableIdentity) {
			this.clearBlob(scope);
			this.finish();
			return;
		}
		const blob = this.readBlob(scope);
		if (!blob) { this.finish(); return; }
		await this.ports.afterPaint();
		await this.restoreScroll(blob.scroll);
		this.ports.focus.restore(blob.focus);
		this.clearBlob(scope);
		this.finish();
	}
	dispose(): void {
		this.historyLease?.finish();
		this.historyLease = undefined;
	}
	private finish(): void {
		this.activeSwitchKey = null;
		this.activeStableIdentity = null;
		this.setRestoring(false);
	}
	private async restoreScroll(snapshot: unknown): Promise<void> {
		if (this.context) { await this.context.restore(snapshot); return; }
		this.ports.scrollTo((snapshot as { y?: number } | null)?.y ?? 0);
	}
	private writeBlob(blob: HandoffBlob): void {
		try { this.ports.store.set('yesid:lstate:' + blob.path, serializeBlob(blob)); }
		catch { /* private mode / quota: no handoff */ }
	}
	private readBlob(scope: string): HandoffBlob | null {
		try { return parseBlob(this.ports.store.get('yesid:lstate:' + scope), scope); }
		catch { return null; }
	}
	private clearBlob(scope: string): void {
		try { this.ports.store.remove('yesid:lstate:' + scope); }
		catch { /* storage must never interrupt navigation */ }
	}
}

export function createReadingSession(ports: SessionPorts): ReadingSession {
	return new Session(ports);
}
