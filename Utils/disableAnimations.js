// utils/disableAnimations.js

export async function disableAnimations(page) {
  // Inject CSS to disable animations globally
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        animation-fill-mode: none !important;
      }

      html, body {
        animation: none !important;
        transition: none !important;
        animation-fill-mode: none !important;
      }

      [data-fade],
      .fade,
      .fade-in,
      .animate-fade-in,
      .use-fade-in,
      .opacity-0,
      .opacity-100,
      [style*="opacity"],
      [style*="transform"] {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
        animation: none !important;
      }

      :focus {
        outline: none !important;
        box-shadow: none !important;
      }

      :hover {
        transition: none !important;
        animation: none !important;
      }
    `
  });

  // JS-level cleanup: remove styles/classes/triggers
  await page.evaluate(() => {
    document.activeElement?.blur();

    document.querySelectorAll('[style]').forEach((el) => {
      const style = el.getAttribute('style');
      if (style.includes('opacity') || style.includes('transform') || style.includes('animation')) {
        el.removeAttribute('style');
      }
    });

    const animationClasses = [
      'fade-in', 'fade', 'animate-fade-in',
      'opacity-0', 'opacity-100', 'use-fade-in'
    ];
    document.querySelectorAll('*').forEach((el) => {
      animationClasses.forEach((cls) => {
        if (el.classList.contains(cls)) {
          el.classList.remove(cls);
        }
      });
    });

    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  });
}
export async function disableLazyRender(page, opts = {}) {
  const timeout = typeof opts.timeout === 'number' ? opts.timeout : 5000;

  // 1) Install IntersectionObserver shim BEFORE any page scripts run:
  // Playwright: page.addInitScript(fn)
  // Puppeteer: page.evaluateOnNewDocument(fn)
  const shim = () => {
    // replace IntersectionObserver so libraries immediately think elements are visible
    class ImmediateIntersectionObserver {
      constructor(cb) { this.cb = cb; this.targets = new Set(); }
      observe(target) {
        this.targets.add(target);
        try {
          // call callback immediately as if element is intersecting
          this.cb([{ target, isIntersecting: true, intersectionRatio: 1 }]);
        } catch (e) {}
      }
      unobserve(target) { this.targets.delete(target); }
      disconnect() { this.targets.clear(); }
      takeRecords() { return []; }
    }
    // Keep a reference if needed
    window.__OriginalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = ImmediateIntersectionObserver;
  };

  // inject shim in a cross-library way
  if (typeof page.addInitScript === 'function') {
    await page.addInitScript(shim); // Playwright
  } else if (typeof page.evaluateOnNewDocument === 'function') {
    await page.evaluateOnNewDocument(shim); // Puppeteer
  } else {
    // fallback (not ideal) - inject once page loads (may be too late)
    await page.evaluate(shim);
  }

  // 2) Run DOM cleanup / force-load replacements AFTER page is loaded
  const res = await page.evaluate(
    async (timeoutMs) => {
      const urlLike = /(^\/\/|^\/|https?:\/\/|data:image\/)/i;
      const maybeUrl = (v) => typeof v === 'string' && (urlLike.test(v) || /\.(jpg|jpeg|png|gif|svg|webp|avif|bmp)(\?.*)?$/i.test(v));

      // Helper: copy attribute value into appropriate property
      function applyUrlToElement(el, attrName, val) {
        try {
          if (!val || !maybeUrl(val)) return;
          const name = attrName.toLowerCase();
          if (name.includes('srcset')) {
            if (el.tagName === 'IMG' || el.tagName === 'SOURCE') el.setAttribute('srcset', val);
          } else if (name.includes('src') || name.includes('original')) {
            if (el.tagName === 'IMG' || el.tagName === 'SOURCE') el.setAttribute('src', val);
            else if (el.tagName === 'IFRAME' || el.tagName === 'VIDEO') el.setAttribute('src', val);
            else el.style.backgroundImage = `url("${val}")`;
          } else if (name.includes('bg') || name.includes('background') || name.includes('image')) {
            el.style.backgroundImage = `url("${val}")`;
          } else {
            // fallback try src
            if (el.tagName === 'IMG') el.setAttribute('src', val);
            else el.style.backgroundImage = `url("${val}")`;
          }
        } catch (e) { /* ignore */ }
      }

      // Remove native lazy attributes, set eager where possible
      document.querySelectorAll('[loading="lazy"]').forEach(el => el.removeAttribute('loading'));
      document.querySelectorAll('img,iframe,video').forEach(el => {
        try { el.loading = 'eager'; } catch (e) {}
      });

      // 1) Move data-* lazy attributes into real src/srcset/background-image
      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        // iterate element attributes and handle data-*
        for (const attr of Array.from(el.attributes)) {
          const an = attr.name.toLowerCase();
          if (!an.startsWith('data-')) continue;
          const val = attr.value && attr.value.trim();
          if (!val) continue;

          // common plugin attribute names can be present: data-src, data-srcset, data-lazy-src, data-lazy-srcset,
          // data-original, data-bg, data-wpr-lazyrender (flag), etc.
          // If attribute looks like a URL -> apply.
          if (maybeUrl(val)) {
            applyUrlToElement(el, an, val);
          }
        }
      }

 // 2) Inject HTML from <noscript> fallbacks ONLY if no existing loaded image
await new Promise(resolve => setTimeout(resolve, 2000)); // wait 100ms before injecting

document.querySelectorAll('noscript').forEach(ns => {
  const parent = ns.parentElement;
  if (!parent) return;

  const html = ns.textContent.trim();
  if (!html) return;

  // Check if parent already has a loaded image
  const hasLoadedImg = Array.from(parent.querySelectorAll('img')).some(
    img => img.complete && img.naturalWidth > 0
  );
  if (hasLoadedImg) {
    ns.remove();
    return;
  }

  try {
    parent.insertAdjacentHTML('beforeend', html);
  } catch (e) {}
  ns.remove();
});

      // 3) Remove known plugin/server-side lazy attributes / flags so CSS/JS won't skip rendering
      const pluginAttrs = [
        'data-wpr-lazyrender', // WP Rocket placeholder flag
        'data-lazy', 'data-lazyload', 'data-lazy-src', 'data-lazy-srcset',
        'data-wp-lazy', 'data-wpfc-lazy', 'data-wpfc-lazy-src'
      ];
      for (const name of pluginAttrs) {
        document.querySelectorAll('[' + name + ']').forEach(el => el.removeAttribute(name));
      }

      // 4) Trigger common events lazy libraries listen for
      ['scroll', 'resize', 'visibilitychange', 'load', 'orientationchange'].forEach(ev => {
        try { window.dispatchEvent(new Event(ev)); } catch (e) {}
      });
      try { document.dispatchEvent(new Event('readystatechange')); } catch (e) {}

      // Dispatch custom lazy events (some libs like lazysizes listen for these)
      ['lazybeforeunveil', 'lazyloaded', 'lazyunveil', 'lazyinit'].forEach(name => {
        try {
          const ev = new CustomEvent(name, { bubbles: true, cancelable: true });
          document.querySelectorAll('*').forEach(el => el.dispatchEvent(ev));
        } catch (e) {}
      });

      // 5) Wait for all images to either load or error (bounded by timeout)
      const imgs = Array.from(document.images || []);
      if (imgs.length === 0) return true;

      const loadPromises = imgs.map(img => new Promise(resolve => {
        if (img.complete && img.naturalWidth !== 0) return resolve(true);
        const onLoad = () => { cleanup(); resolve(true); };
        const onError = () => { cleanup(); resolve(false); };
        const cleanup = () => { img.removeEventListener('load', onLoad); img.removeEventListener('error', onError); };
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
        // nudge the browser to re-evaluate src (some libs rely on reassign)
        try { img.src = img.src; } catch (e) {}
      }));

      const allPromise = Promise.all(loadPromises);
      const timeoutPromise = new Promise(res => setTimeout(() => res('timeout'), timeoutMs));
      const race = await Promise.race([allPromise, timeoutPromise]);

      // return true if images loaded OR timed out (we don't want tests to hang forever)
      return race === 'timeout' ? false : true;
    },
    timeout
  );

  // small pause to allow layout & reflow after forcing loads
  await page.waitForTimeout(200);

  return res;
}
