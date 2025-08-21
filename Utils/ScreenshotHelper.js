// utils/ScreenshotHelper.js
import { maskEverythingExcept, cropWhiteMargins } from './domUtils.js';
import { disableLazyRender } from './disableAnimations.js';
import path from 'path';
export class ScreenshotHelper {
  constructor(page, viewport, {
    selector,
    filePrefix,
    block,
    scrollBlock ,
    diffDir = './diff_output',
    waitAfterScroll = 200
  }) {
    this.page = page;
    this.block = block;
    this.viewport = viewport;
    this.selector = selector;
    this.filePrefix = filePrefix;
    this.scrollBlock = scrollBlock;
    this.diffDir = diffDir;
    this.waitAfterScroll = waitAfterScroll;
  }
    async capture(viewportSizes) {
  const size = viewportSizes[this.viewport];
  await this.page.setViewportSize(size);


  // Force exact device scaling to prevent rendering shrink
  await this.page.emulateMedia({ media: 'screen' });
  console.log('1111asdas');
  await this.page.addStyleTag({
    content: `
      ::-webkit-scrollbar { display: none !important; }
      html, body {
        width: ${size.width}px !important;
        overflow: hidden !important;
        scrollbar-width: none !important;
        zoom: 1 !important;
      }
    `
  });
  console.log('asdas');
  const maskedFullPagePath = `${this.diffDir}/${this.filePrefix}${this.viewport}-masked-full.png`;
  const croppedElementPath = `${this.diffDir}/${this.filePrefix}${this.viewport}.png`;
  console.log('qqqqqs');
  await this.page.waitForSelector(this.selector, { timeout: 20000 });
  await this.page.$eval(this.selector, (el, block) =>
    el.scrollIntoView({ behavior: 'instant', block }),
    this.scrollBlock
  );
  console.log('33333');
  await this.page.waitForTimeout(this.waitAfterScroll);
  await maskEverythingExcept(this.page, this.selector);
  await this.page.waitForTimeout(this.waitAfterScroll);

  const elementHandle = await this.page.$(this.selector);
  const bodyWidth = await this.page.evaluate(() => document.body.clientWidth);
console.log(`Viewport width: ${size.width}, Body width: ${bodyWidth}`);

  await elementHandle.screenshot({ path: maskedFullPagePath });

  await cropWhiteMargins(maskedFullPagePath, croppedElementPath);

  return {
    full: maskedFullPagePath,
    cropped: croppedElementPath
  };
}

}