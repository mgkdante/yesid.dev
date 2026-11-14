export const shared = /^(?:led-pulse|pulse-glow|blink-light|terminal-blink|station-ping|gradient-flow)(?:-|$)/;
export const weather = /^weather-(?:twinkle|glow|float|drift|fall|snow|zap|flash|haze)(?:-|$)/;

export function readRunningAnimations() {
 const describe = (el: Element | null) => el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.getAttribute('data-slot') ? '[data-slot=' + el.getAttribute('data-slot') + ']' : ''}.${el.getAttribute('class') ?? ''}` : 'unknown';
 return document.getAnimations().filter(a => a.playState === 'running').map(a => {
      const target = (a.effect as KeyframeEffect)?.target as Element | null;
      const property = a instanceof CSSTransition ? a.transitionProperty : '';
      // The retained closing scene follows scroll; it can still be settling when sampled.
      const closingTransition = Boolean(target?.closest('[data-testid="closer-section"]') && (
       (property === 'height' && target.matches('.construction-extension, .closer-beam')) ||
       (property === 'translate' && target.matches('[data-slot="closer-floodlight"]')) ||
       (property === 'scale' && target.matches('.closer-beam')) ||
       (property === 'transform' && target.matches('[data-construction-prop] > svg'))
      ));
      return { name: a instanceof CSSAnimation ? a.animationName.replace(/^svelte-[^-]+-/, '') : a instanceof CSSTransition ? `transition:${property}` : 'WebAnimation', loop: a.effect?.getTiming().iterations === Infinity, target: describe(target), closingTransition, shared: Boolean(target?.closest('[data-slot="stop-label"], [data-slot="error-page"], [data-testid="footer"], [data-slot="terminal-panel"], [data-slot="metro-station"], [data-slot="separator"]')) };
     });
}

type Motion = ReturnType<typeof readRunningAnimations>[number];
export const unexpectedLoops = (records: readonly Motion[]) => records.filter(a => a.loop && !(shared.test(a.name) && a.shared) && !weather.test(a.name));
export const unexpectedFinite = (records: readonly Motion[]) => records.filter(a => !a.loop && !a.closingTransition && !['draw', 'post-swing', 'board-settle', 'transition:opacity'].includes(a.name));
