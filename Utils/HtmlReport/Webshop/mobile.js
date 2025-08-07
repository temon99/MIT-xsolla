// /utils/HtmlReport/aboutXsolla/aboutUs/mobile.js

import fs from 'fs';
import { createHtmlTemplate } from '../../baseTemplate';

export function generateHtmlReport({
  diffPixels,
  outputDir,
  reportPath,
  expectedImage = 'webshopCheckoutMobile-expected.png',
  actualImage = 'webshopCheckoutMobile-actual.png',
  diffImage = 'webshopCheckoutMobile-diff.png',
  pageName = 'Webshop Checkout Mobile'
}) {
  const html = createHtmlTemplate({
    pageName,
    diffPixels,
    expectedImage,
    actualImage,
    diffImage
  });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reportPath, html);
}
