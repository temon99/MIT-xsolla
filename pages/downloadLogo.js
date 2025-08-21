import { ScreenshotHelper } from '../Utils/ScreenshotHelper.js';
import { getEnabledViewports } from '../utils/viewPorts.js';
import { goToPage } from '../utils/navigateToPage.js';
import { mainPageSelectors } from '../Utils/mainPageSelector.js'; 
import { mainPageSlug } from '../Utils/slug.js'
import { disableAnimations } from '../Utils/disableAnimations.js';

const viewportSizes = getEnabledViewports(4);

export class DownloadLogo {
  constructor(page, viewport) {
    this.page = page;
    this.viewport = viewport;
    this.disableAnimations = false;
    this.selector = mainPageSelectors.downloadLogo;
    this.filePrefix = 'download-logo';
    // this.slug = mainPageSlug.home;
  }

  async goto() {
    await goToPage(this.page, this.slug, {
      selector: this.selector,
      timeout: 20000,
      scroll: false
    });
  }
    
  async takeScreenshot() {
    const helper = new ScreenshotHelper(this.page, this.viewport, {
      selector: this.selector,
      filePrefix: this.filePrefix,
      scrollBlock: 'start',
       block: 'start',
    });

    return await helper.capture(viewportSizes);
  }
}
