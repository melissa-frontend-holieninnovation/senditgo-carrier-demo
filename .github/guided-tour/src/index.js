// Entry point of the guided tour. Loaded by one <script type="module"> tag on
// every page of the demo that runs the app (see tools/inject.mjs).
//
// Start a tour with a link:   <site>/?tour=<tour id>          (opens on step 1)
//                             <site>/?tour=<tour id>&step=3   (opens on step 3)
// or from the console:        SenditGoTour.start('<tour id>')

import { createTourRunner } from './engine.js';
import { tours } from './tours/index.js';

const here = new URL(import.meta.url);
// This file is served from <base>tour/index.js, so the site base is one folder up.
const basePath = here.pathname.replace(/[^/]*\/[^/]*$/, '');

if (!document.querySelector('link[data-senditgo-tour]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./tour.css', here).href;
  link.setAttribute('data-senditgo-tour', '');
  document.head.appendChild(link);
}

// Tours show the demo in light mode: it reads better when the demo is presented.
const runner = createTourRunner({
  tours,
  win: window,
  basePath,
  theme: 'light',
});
window.SenditGoTour = runner;

const params = new URLSearchParams(window.location.search);
const requested = params.get('tour');
if (requested) {
  const begin = () =>
    runner.start(requested, { step: params.get('step') || 1 });
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', begin, { once: true });
  else begin();
}
