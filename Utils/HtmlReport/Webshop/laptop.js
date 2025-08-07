// /utils/HtmlReport/Demo/laptop.js

import fs from 'fs';
import { createHtmlTemplate } from '../../baseTemplate';

export function generateHtmlReport({
  diffPixels,
  outputDir,
  reportPath,
  expectedImage = 'webshopLaptop-expected.png',
  actualImage = 'webshopLaptop-actual.png',
  diffImage = 'webshopLaptop-diff.png',
  pageName = 'Webshop Laptop'
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
