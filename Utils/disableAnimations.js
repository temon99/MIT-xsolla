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
