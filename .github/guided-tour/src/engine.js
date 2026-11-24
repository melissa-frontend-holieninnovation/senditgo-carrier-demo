// Guided tour engine for the carrier demo.
//
// The demo ships as generated files, so the tour runs as an overlay: it finds
// the real controls by their data-testid, draws a ring and a prompt next to
// them, and moves on when the user clicks the highlighted control or the Next
// button. The overlay never blocks the page: every control stays clickable,
// and leaving the tour removes everything it added.

import { toSelector } from './anchors.js';
import { clipTo, computePlacement, showsEnough } from './placement.js';

const RING_PAD = 4;
const MISSING_AFTER_MS = 4000;
const WRONG_PAGE_AFTER_MS = 1200;
const REOPEN_AFTER_MS = 600;
const THEME_WAIT_MS = 5000;
/** The demo's own light/dark switch in the header. */
export const THEME_TOGGLE_TESTID = 'theme-toggle';
// Ancestors that have no box of their own to clip with, whatever their overflow says.
const BOXLESS =
  /^(contents|inline|table-row|table-row-group|table-header-group|table-footer-group|table-column|table-column-group)$/;

export const TEXT = {
  next: 'Next',
  finish: 'Finish',
  continue: 'Continue',
  leave: 'Leave tour',
  clickHint: 'Click the highlighted control to continue.',
  count: (step, total) => `${step} / ${total}`,
  stepLabel: (step, total) => `Tour step ${step} of ${total}`,
  lostTitle: (label) => `Can't find ${label} on this screen`,
  lostBody: 'The tour is waiting for it. Bring it back, or leave the tour.',
  wrongPage: (page) => `This step is on the ${page} page.`,
  goTo: (page) => `Go to ${page}`,
  narrowTitle: 'This tour needs a wider window',
  narrowBody: 'Make the window wider, or open the demo on a computer.',
  startAgain: 'Start again',
  close: 'Close',
};

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]
  );

/** Escapes text and turns **words** into bold, the only formatting tour text uses. */
export const richText = (value) =>
  escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

/** "/senditgo-carrier-demo/run-management/run-sheets/" with base "/senditgo-carrier-demo/" becomes "/run-management/run-sheets". */
export function routeOf(pathname, basePath) {
  let path = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length - 1)
    : pathname;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path || '/';
}

let maskSequence = 0;

/**
 * `theme`, when given ('light' or 'dark'), is the theme the demo is shown in while a tour runs.
 */
export function createTourRunner({
  tours,
  win = window,
  basePath = '/',
  theme = null,
}) {
  const doc = win.document;
  let state = null;

  const currentStep = () =>
    state && !state.ended ? state.tour.steps[state.index] : null;
  const viewport = () => ({ width: win.innerWidth, height: win.innerHeight });
  const onRoute = (step) =>
    !step.route || routeOf(win.location.pathname, basePath) === step.route;

  /**
   * What the tour is showing right now, mirrored on the overlay as data-state and data-step:
   *   waiting  a step is chosen but its control is not on screen yet; nothing is drawn or said
   *   step     the prompts of the step are on screen
   *   unavailable  the screen confirms this step has no data to show
   *   lost     the "can't find it" or "wrong page" notice
   *   narrow   the "wider window" notice
   *   end      the end page
   * Every change except "waiting" is read out to screen readers (`spoken`) and sent out as a
   * `senditgo-tour` event. A step that turns out to be done already therefore never counts as shown.
   */
  function setPhase(phase, spoken = '') {
    if (!state || state.phase === phase) return;
    state.phase = phase;
    state.root.setAttribute('data-state', phase);
    state.root.setAttribute(
      'data-step',
      state.ended ? 'end' : String(state.index + 1)
    );
    if (phase === 'waiting') return;
    state.live.textContent = spoken.replace(/\*\*/g, '');
    win.dispatchEvent(
      new win.CustomEvent('senditgo-tour', {
        detail: {
          type: phase,
          tourId: state.tour.id,
          step: state.ended ? null : state.index + 1,
        },
      })
    );
  }

  /**
   * The part of an element the user can actually see: its box cut down by the window and by every
   * ancestor that scrolls or clips. Null when too little of it shows to point at.
   */
  function visiblePart(element, box, view) {
    const full = {
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    };
    let part = clipTo(full, {
      left: 0,
      top: 0,
      width: view.width,
      height: view.height,
    });
    let node = element;
    let style = win.getComputedStyle(node);
    while (part && style.position !== 'fixed') {
      // Only the containing-block chain clips: an absolutely positioned box escapes the ancestors in between.
      const parent =
        style.position === 'absolute' ? node.offsetParent : node.parentElement;
      if (!parent || parent === doc.body || parent === doc.documentElement)
        break;
      node = parent;
      style = win.getComputedStyle(node);
      const axes = {
        x: style.overflowX !== 'visible',
        y: style.overflowY !== 'visible',
      };
      const clips =
        (axes.x || axes.y) &&
        !BOXLESS.test(style.display) &&
        node instanceof win.HTMLElement;
      if (clips) {
        const frame = node.getBoundingClientRect();
        part = clipTo(
          part,
          {
            left: frame.left + node.clientLeft,
            top: frame.top + node.clientTop,
            width: node.clientWidth,
            height: node.clientHeight,
          },
          axes
        );
      }
    }
    return showsEnough(full, part) ? part : null;
  }

  /**
   * The first element matching the selector that the user can see, with the part of it that shows.
   * When none shows, the first one that exists comes back with `rect: null` (it may need scrolling to).
   * The tour's own markup is ignored.
   */
  function locate(selector, view = viewport()) {
    let hidden = null;
    for (const element of doc.querySelectorAll(selector)) {
      const box = element.getBoundingClientRect();
      const exists =
        !(state && state.root.contains(element)) &&
        box.width > 0 &&
        box.height > 0 &&
        win.getComputedStyle(element).visibility !== 'hidden';
      if (exists) {
        const rect = visiblePart(element, box, view);
        if (rect) return { element, rect };
        hidden = hidden || { element, rect: null };
      }
    }
    return hidden;
  }

  const find = (selector) => {
    const hit = locate(selector);
    return hit ? hit.element : null;
  };

  const seen = (selector) => {
    const hit = locate(selector);
    return Boolean(hit && hit.rect);
  };

  function urlFor(tour, stepNumber) {
    const step = tour.steps[stepNumber - 1];
    const route =
      step.route && step.route !== '/' ? `${step.route.slice(1)}/` : '';
    const query =
      stepNumber > 1
        ? `?tour=${tour.id}&step=${stepNumber}`
        : `?tour=${tour.id}`;
    return `${basePath}${route}${query}`;
  }

  function mount() {
    const maskId = `sgt-mask-${(maskSequence += 1)}`;
    const root = doc.createElement('div');
    root.className = 'sgt-root';
    root.setAttribute('data-senditgo-tour-root', '');
    root.setAttribute('data-tour', state.tour.id);
    root.innerHTML =
      `<svg class="sgt-dim" aria-hidden="true" focusable="false"><defs><mask id="${maskId}">` +
      '<rect x="0" y="0" width="100%" height="100%" fill="#fff"></rect></mask></defs>' +
      `<rect class="sgt-dim__fill" x="0" y="0" width="100%" height="100%" mask="url(#${maskId})"></rect></svg>` +
      '<div class="sgt-live" role="status" aria-live="polite"></div>';
    doc.body.appendChild(root);
    state.root = root;
    state.mask = root.querySelector('mask');
    state.live = root.querySelector('.sgt-live');
    doc.addEventListener('keydown', onKeydown, true);
    doc.addEventListener('click', onClick, true);
    state.frame = win.requestAnimationFrame(tick);
  }

  function clearStep() {
    for (const item of state.prompts) {
      item.ring.remove();
      item.tip.remove();
      item.hole.remove();
    }
    state.prompts = [];
    if (state.card) {
      state.card.remove();
      state.card = null;
    }
    state.missingSince = 0;
    state.scrolled = false;
    state.focused = false;
  }

  function addSelectionPractice(tip) {
    const group = doc.createElement('div');
    group.className = 'sgt-practice';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Practice selection');
    group.innerHTML =
      '<strong>Practice selection</strong>' +
      '<ul><li><b>Example 01</b><span>Available</span></li>' +
      '<li data-sgt="unavailable-order"><b>Example 02</b><span id="sgt-example-reason">Unavailable · Assigned elsewhere</span>' +
      '<button type="button" aria-describedby="sgt-example-reason">Remove from example</button></li></ul>' +
      '<p role="status" tabindex="-1"></p>';
    const row = group.querySelector('[data-sgt="unavailable-order"]');
    const remove = row.querySelector('button');
    remove.addEventListener('click', () => {
      const keepFocus = doc.activeElement === remove;
      row.remove();
      const result = group.querySelector('[role="status"]');
      result.textContent = 'Example 02 removed. Example 01 is still selected.';
      if (keepFocus) result.focus({ preventScroll: true });
    });
    tip.querySelector('.sgt-tip__foot').before(group);
  }

  function buildPrompt(prompt, position, step, stepNumber, total) {
    const main = position === 0;
    const ring = doc.createElement('div');
    ring.className = `sgt-ring${prompt.kind === 'hotspot' ? ' sgt-ring--pulse' : ''}`;
    ring.setAttribute('aria-hidden', 'true');

    const tip = doc.createElement('div');
    tip.className = `sgt-tip${main ? ' sgt-tip--main' : ''}`;
    const textId = `sgt-text-${stepNumber}-${position}`;
    if (main) {
      const clickStep = step.advanceOn === 'click';
      tip.setAttribute('role', 'dialog');
      tip.setAttribute('aria-modal', 'false');
      tip.setAttribute('aria-label', TEXT.stepLabel(stepNumber, total));
      tip.setAttribute('aria-describedby', textId);
      tip.tabIndex = -1;
      tip.innerHTML =
        `<div class="sgt-tip__head"><span class="sgt-tip__count">${TEXT.count(stepNumber, total)}</span>` +
        `<button type="button" class="sgt-tip__close" data-sgt="leave" aria-label="${TEXT.leave}"><span aria-hidden="true">×</span></button></div>` +
        `<p class="sgt-tip__text" id="${textId}">${richText(prompt.text)}</p>${
          clickStep
            ? `<p class="sgt-tip__hint">${TEXT.clickHint}</p>`
            : `<div class="sgt-tip__foot"><button type="button" class="sgt-btn" data-sgt="next">${stepNumber === total ? TEXT.finish : TEXT.next}<span aria-hidden="true"> →</span></button></div>`
        }<span class="sgt-tip__arrow" aria-hidden="true"></span>`;
      tip
        .querySelector('[data-sgt="leave"]')
        .addEventListener('click', () => stop());
      const nextButton = tip.querySelector('[data-sgt="next"]');
      if (nextButton) {
        nextButton.addEventListener('click', () => next());
        if (step.practice === 'stale-selection') addSelectionPractice(tip);
      }
    } else {
      tip.setAttribute('role', 'note');
      tip.innerHTML = `<p class="sgt-tip__text" id="${textId}">${richText(prompt.text)}</p><span class="sgt-tip__arrow" aria-hidden="true"></span>`;
    }

    const hole = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hole.setAttribute('fill', '#000');
    hole.setAttribute('rx', '10');
    state.mask.appendChild(hole);
    state.root.append(ring, tip);
    return {
      prompt,
      selector: toSelector(prompt.target),
      ring,
      tip,
      hole,
      key: '',
      visible: false,
    };
  }

  /** True when what the step asks the user to open is on screen already. */
  const alreadyDone = (step) =>
    Boolean(step.skipWhen && onRoute(step) && seen(toSelector(step.skipWhen)));

  function show(index) {
    const total = state.tour.steps.length;
    // Skip steps whose result is already there (for example a panel the user left open).
    while (index < total && alreadyDone(state.tour.steps[index])) index += 1;
    if (index >= total) {
      showEnd();
      return;
    }
    clearStep();
    state.ended = false;
    state.index = index;
    const step = state.tour.steps[index];
    state.prompts = step.prompts.map((prompt, position) =>
      buildPrompt(prompt, position, step, index + 1, total)
    );
    state.phase = null;
    setPhase('waiting');
  }

  /** What a screen reader hears for the step on screen: its number and the prompts that are shown. */
  function stepSpoken(step) {
    const shown = state.prompts
      .filter((item) => item.visible)
      .map((item) => item.prompt.text);
    const hint = step.advanceOn === 'click' ? [TEXT.clickHint] : [];
    return [
      `${TEXT.stepLabel(state.index + 1, state.tour.steps.length)}.`,
      ...shown,
      ...hint,
    ].join(' ');
  }

  function setVisible(item, visible) {
    if (item.visible === visible) return;
    item.visible = visible;
    item.ring.toggleAttribute('data-placed', visible);
    item.tip.toggleAttribute('data-placed', visible);
    if (!visible) {
      item.key = '';
      item.hole.setAttribute('width', '0');
      item.hole.setAttribute('height', '0');
    }
  }

  function focusStep(step, mainElement) {
    if (state.focused) return;
    state.focused = true;
    const nextButton = state.prompts[0].tip.querySelector('[data-sgt="next"]');
    // On a click step the user has to activate the real control, so it gets the focus:
    // Enter or Space then works for keyboard users exactly as a click does.
    const target = step.advanceOn === 'click' ? mainElement : nextButton;
    try {
      target.focus({ preventScroll: true });
      if (doc.activeElement !== target)
        state.prompts[0].tip.focus({ preventScroll: true });
    } catch {
      /* focus is a convenience; the tour works without it */
    }
  }

  function showCard(kind, html, wire) {
    if (state.card && state.card.dataset.kind === kind) return;
    if (state.card) state.card.remove();
    const card = doc.createElement('div');
    card.className = `sgt-card sgt-card--${kind}`;
    card.dataset.kind = kind;
    card.innerHTML = html;
    state.root.appendChild(card);
    state.card = card;
    wire(card);
  }

  /** Removes the notice of the given kind, if it is the one on screen. */
  function dropCard(kind) {
    if (!state.card || state.card.dataset.kind !== kind) return false;
    state.card.remove();
    state.card = null;
    return true;
  }

  function showNarrow() {
    if (state.card && state.card.dataset.kind === 'narrow') return;
    showCard(
      'narrow',
      `<p class="sgt-card__title">${TEXT.narrowTitle}</p><p class="sgt-card__text">${TEXT.narrowBody}</p>` +
        `<div class="sgt-card__actions"><button type="button" class="sgt-btn sgt-btn--ghost" data-sgt="leave">${TEXT.leave}</button></div>`,
      (card) => {
        card
          .querySelector('[data-sgt="leave"]')
          .addEventListener('click', () => stop());
      }
    );
    setPhase('narrow', `${TEXT.narrowTitle}. ${TEXT.narrowBody}`);
  }

  function showLost(step) {
    const wrongPage = !onRoute(step);
    const label = step.prompts[0].label
      ? `“${step.prompts[0].label}”`
      : 'the next control';
    const page = step.page || 'right';
    showCard(
      'lost',
      `<p class="sgt-card__title">${escapeHtml(wrongPage ? TEXT.wrongPage(page) : TEXT.lostTitle(label))}</p>${
        wrongPage ? '' : `<p class="sgt-card__text">${TEXT.lostBody}</p>`
      }<div class="sgt-card__actions">${
        wrongPage
          ? `<button type="button" class="sgt-btn sgt-btn--solid" data-sgt="go">${escapeHtml(TEXT.goTo(page))}</button>`
          : ''
      }<button type="button" class="sgt-btn sgt-btn--ghost" data-sgt="leave">${TEXT.leave}</button></div>`,
      (card) => {
        card
          .querySelector('[data-sgt="leave"]')
          .addEventListener('click', () => stop());
        const go = card.querySelector('[data-sgt="go"]');
        if (go)
          go.addEventListener('click', () =>
            win.location.assign(urlFor(state.tour, state.index + 1))
          );
      }
    );
    setPhase(
      'lost',
      wrongPage
        ? TEXT.wrongPage(page)
        : `${TEXT.lostTitle(label)}. ${TEXT.lostBody}`
    );
  }

  // A missing control alone can mean a broken selector or an unfinished render.
  // Offer the alternate path only when the page also displays its configured empty state.
  function canBypass(step) {
    return Boolean(
      step.unavailable &&
        onRoute(step) &&
        find(toSelector(step.unavailable.when))
    );
  }

  function showUnavailable(step) {
    const { action, message, nextStep } = step.unavailable;
    const label = action === 'finish' ? TEXT.finish : TEXT.continue;
    showCard(
      'unavailable',
      `<p class="sgt-card__text" id="sgt-unavailable-text">${escapeHtml(message)}</p>` +
        `<div class="sgt-card__actions"><button type="button" class="sgt-btn sgt-btn--solid" data-sgt="continue">${label}</button>` +
        `<button type="button" class="sgt-btn sgt-btn--ghost" data-sgt="leave">${TEXT.leave}</button></div>`,
      (card) => {
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-labelledby', 'sgt-unavailable-text');
        card
          .querySelector('[data-sgt="leave"]')
          .addEventListener('click', () => stop());
        const button = card.querySelector('[data-sgt="continue"]');
        button.addEventListener('click', () => {
          if (
            currentStep() !== step ||
            !canBypass(step) ||
            find(state.prompts[0].selector)
          )
            return;
          if (action === 'finish') showEnd();
          else show(state.tour.steps.findIndex((item) => item.id === nextStep));
        });
        button.focus({ preventScroll: true });
      }
    );
    setPhase('unavailable', message);
  }

  function showEnd() {
    clearStep();
    state.ended = true;
    const { end } = state.tour;
    showCard(
      'end',
      `<h2 class="sgt-card__heading" id="sgt-end-title">${richText(end.title)}</h2>` +
        `<p class="sgt-card__text">${richText(end.text)}</p>` +
        '<div class="sgt-card__actions">' +
        `<button type="button" class="sgt-btn sgt-btn--ghost" data-sgt="restart">${TEXT.startAgain}</button>` +
        `<button type="button" class="sgt-btn sgt-btn--solid" data-sgt="close">${TEXT.close}</button></div>`,
      (card) => {
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-modal', 'false');
        card.setAttribute('aria-labelledby', 'sgt-end-title');
        card
          .querySelector('[data-sgt="close"]')
          .addEventListener('click', () => stop());
        card
          .querySelector('[data-sgt="restart"]')
          .addEventListener('click', () => restart());
        card.querySelector('[data-sgt="close"]').focus({ preventScroll: true });
      }
    );
    setPhase('end', `${end.title}. ${end.text}`);
  }

  function restart() {
    const first = state.tour.steps[0];
    if (onRoute(first)) show(0);
    else win.location.assign(urlFor(state.tour, 1));
  }

  function next() {
    if (!state || state.ended) return;
    if (state.index + 1 >= state.tour.steps.length) showEnd();
    else show(state.index + 1);
  }

  /**
   * Shows the demo in the tour's theme, once per start of a tour. It presses the demo's own
   * header switch, so the page, the switch and the saved setting stay in step. A visitor who
   * switches back afterwards is left alone.
   */
  function applyTheme(now) {
    if (!theme || state.themeSettled) return;
    const current = doc.documentElement.getAttribute('data-theme');
    if (current === theme) {
      state.themeSettled = true;
      return;
    }
    if (!state.themeSince) state.themeSince = now;
    const toggle = current && find(`[data-testid="${THEME_TOGGLE_TESTID}"]`);
    if (toggle) {
      state.themeSettled = true;
      toggle.click();
    } else if (now - state.themeSince > THEME_WAIT_MS) {
      // No switch on this page: the tour reads well in either theme.
      state.themeSettled = true;
    }
  }

  function tick(now) {
    if (!state) return;
    state.frame = win.requestAnimationFrame(tick);
    applyTheme(now);
    const step = currentStep();
    if (!step) return;
    const view = viewport();

    // Below this width the pages are laid out differently and some of the controls are not there.
    if (state.tour.minWidth && view.width < state.tour.minWidth) {
      for (const item of state.prompts) setVisible(item, false);
      showNarrow();
      return;
    }
    if (dropCard('narrow')) setPhase('waiting');

    // A step that asks for something to be opened is over as soon as that thing is on screen,
    // whichever way it got there: the highlighted control, a menu that opens on hover, the keyboard.
    if (alreadyDone(step)) {
      next();
      return;
    }

    const found = state.prompts.map((item) => locate(item.selector, view));

    const main = found[0];
    const mainShown = Boolean(main && main.rect);
    if (main && !mainShown && !state.scrolled) {
      // Once per step; after that the user is free to scroll away.
      state.scrolled = true;
      main.element.scrollIntoView({ block: 'center', inline: 'nearest' });
    }

    const placed = [];
    state.prompts.forEach((item, position) => {
      const hit = found[position];
      if (!hit || !hit.rect) {
        setVisible(item, false);
        return;
      }
      const tipSize = {
        width: item.tip.offsetWidth,
        height: item.tip.offsetHeight,
      };
      // What the prompt must keep clear of: the other controls of this step and the prompts placed before it.
      const avoid = [
        ...found
          .filter((other, index) => other && other.rect && index !== position)
          .map((other) => other.rect),
        ...placed,
      ];
      // Everything the position depends on. It is worked out again only when one of these changes.
      const key = [hit.rect, tipSize, view, ...avoid]
        .map((box) =>
          [box.left || 0, box.top || 0, box.width, box.height]
            .map(Math.round)
            .join(',')
        )
        .join(';');
      if (key !== item.key) {
        item.key = key;
        const ring = {
          left: hit.rect.left - RING_PAD,
          top: hit.rect.top - RING_PAD,
          width: hit.rect.width + RING_PAD * 2,
          height: hit.rect.height + RING_PAD * 2,
        };
        Object.assign(item.ring.style, {
          left: `${ring.left}px`,
          top: `${ring.top}px`,
          width: `${ring.width}px`,
          height: `${ring.height}px`,
        });
        for (const [name, value] of Object.entries({
          x: ring.left,
          y: ring.top,
          width: ring.width,
          height: ring.height,
        }))
          item.hole.setAttribute(name, String(value));
        const spot = computePlacement({
          target: ring,
          tip: tipSize,
          viewport: view,
          prefer: item.prompt.side || 'bottom',
          avoid,
        });
        item.tip.style.left = `${spot.left}px`;
        item.tip.style.top = `${spot.top}px`;
        item.tip.setAttribute('data-side', spot.side);
        item.tip.style.setProperty(
          '--sgt-arrow-left',
          spot.arrow && spot.arrow.left !== undefined
            ? `${spot.arrow.left}px`
            : '50%'
        );
        item.tip.style.setProperty(
          '--sgt-arrow-top',
          spot.arrow && spot.arrow.top !== undefined
            ? `${spot.arrow.top}px`
            : '50%'
        );
        item.spot = {
          left: spot.left,
          top: spot.top,
          width: tipSize.width,
          height: tipSize.height,
        };
      }
      placed.push(item.spot);
      setVisible(item, true);
    });

    if (mainShown) {
      state.missingSince = 0;
      if (dropCard('unavailable') || dropCard('lost')) state.focused = false;
      setPhase('step', stepSpoken(step));
      focusStep(step, main.element);
      return;
    }

    // The control of this step is not on screen (yet).
    if (!state.missingSince) state.missingSince = now;
    const missingFor = now - state.missingSince;
    if (!main && canBypass(step)) {
      if (missingFor > REOPEN_AFTER_MS) {
        for (const item of state.prompts) setVisible(item, false);
        showUnavailable(step);
      }
      return;
    }
    if (dropCard('unavailable')) {
      state.focused = false;
      setPhase('waiting');
    }
    // The user closed what the step before had opened (a menu, a panel): ask for it again.
    const earlier = state.index > 0 ? state.tour.steps[state.index - 1] : null;
    if (
      !main &&
      earlier &&
      earlier.skipWhen &&
      missingFor > REOPEN_AFTER_MS &&
      onRoute(earlier) &&
      !alreadyDone(earlier) &&
      seen(toSelector(earlier.prompts[0].target))
    ) {
      show(state.index - 1);
      return;
    }
    if (missingFor > (onRoute(step) ? MISSING_AFTER_MS : WRONG_PAGE_AFTER_MS))
      showLost(step);
  }

  function onClick(event) {
    const step = currentStep();
    if (!step || step.advanceOn !== 'click') return;
    const element = find(state.prompts[0].selector);
    if (!element || !element.contains(event.target)) return;
    // Let the app handle the click first; the next step then waits for whatever it opens.
    win.setTimeout(() => {
      if (state && currentStep() === step) next();
    }, 0);
  }

  function onKeydown(event) {
    if (event.key !== 'Escape' || !state) return;
    const active = doc.activeElement;
    const step = currentStep();
    const mainElement = step ? find(state.prompts[0].selector) : null;
    // Escape leaves the tour only when the tour (or the control it handed focus to) has the focus,
    // so it does not also close the tour when the user is closing one of the app's own menus.
    if (
      state.root.contains(active) ||
      active === doc.body ||
      (mainElement && mainElement === active)
    ) {
      event.stopPropagation();
      stop();
    }
  }

  function stop() {
    if (!state) return;
    const finished = state;
    state = null;
    win.cancelAnimationFrame(finished.frame);
    doc.removeEventListener('keydown', onKeydown, true);
    doc.removeEventListener('click', onClick, true);
    finished.root.remove();
    win.dispatchEvent(
      new win.CustomEvent('senditgo-tour', {
        detail: { type: 'stop', tourId: finished.tour.id, step: null },
      })
    );
  }

  /**
   * Starts a tour. `step` is 1-based. When the step belongs to another page the browser is sent
   * there with the tour in the address, and the tour starts once that page has loaded.
   */
  function start(id, { step = 1 } = {}) {
    const tour = tours.find((item) => item.id === id);
    if (!tour) return false;
    const stepNumber = Math.min(
      Math.max(1, Math.floor(Number(step)) || 1),
      tour.steps.length
    );
    if (!onRoute(tour.steps[stepNumber - 1])) {
      win.location.assign(urlFor(tour, stepNumber));
      return true;
    }
    stop();
    state = {
      tour,
      index: 0,
      ended: false,
      prompts: [],
      card: null,
      root: null,
      mask: null,
      live: null,
      frame: 0,
      missingSince: 0,
      scrolled: false,
      focused: false,
      phase: null,
      themeSettled: false,
      themeSince: 0,
    };
    mount();
    show(stepNumber - 1);
    return true;
  }

  return {
    start,
    stop,
    next,
    list: () =>
      tours.map((tour) => ({
        id: tour.id,
        title: tour.title,
        steps: tour.steps.length,
      })),
    linkFor: (id) => {
      const tour = tours.find((item) => item.id === id);
      return tour ? urlFor(tour, 1) : null;
    },
    current: () =>
      state
        ? {
            tourId: state.tour.id,
            step: state.ended ? null : state.index + 1,
            ended: state.ended,
          }
        : null,
  };
}
