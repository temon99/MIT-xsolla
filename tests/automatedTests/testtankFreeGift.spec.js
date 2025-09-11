import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { FreeGift } from '../../pages/freeGift.js';
import { compareScreenshots } from '../../Utils/compareScreenShots.js';
import { generateHtmlReport as generateTabbedReportHtml } from '../../utils/HtmlReport/generateTabbedReport.js';
import { generateHtmlReport } from '../../utils/HtmlReport/htmlReport.js';
import { loginBeforeEachTest } from '../../Utils/loginSetup.js';

const diffDir = './diff_output';
const componentName = 'freeGift';

const viewports = [
  { name: 'Laptop', htmlGen: generateHtmlReport },
  { name: 'Mobile', htmlGen: generateHtmlReport }
].map(view => ({
  ...view,
  expectedPath: `./expected_screenshots/${componentName}/${componentName}${view.name}Figma.png`
}));

const diffResults = Object.fromEntries(viewports.map(({ name }) => [name, { status: 'Pending', diffPixels: null }]));

let page; // shared pageFreeGift

// SERIAL BLOCK — Ensures tests run one after another
test.describe.serial(`${componentName} VRT Suite`, () => {
  test.beforeAll(async ({ browser }) => {
    // ✅ login once before all tests
    const context = await browser.newContext();
    page = await context.newPage();
    await loginBeforeEachTest(page);
  });

  for (const { name: viewport, expectedPath, htmlGen } of viewports) {
    test(`${viewport} - ${componentName} visual should match Figma`, async () => {
      const pageObject = new FreeGift(page, viewport);
      await pageObject.goto();

      const { cropped } = await pageObject.takeScreenshot();
      const actualBuffer = fs.readFileSync(cropped);

      const diffPixels = compareScreenshots({
        actualBuffer,
        expectedPath,
        actualPath: `${diffDir}/${componentName}${viewport}-actual.png`,
        diffPath: `${diffDir}/${componentName}${viewport}-diff.png`,
        expectedCopyPath: `${diffDir}/${componentName}${viewport}-expected.png`
      });

      htmlGen({
        diffPixels,
        outputDir: diffDir,
        reportPath: `${diffDir}/${componentName}${viewport}-report.html`,
        expectedImage: `${componentName}${viewport}-expected.png`,
        actualImage: `${componentName}${viewport}-actual.png`,
        diffImage: `${componentName}${viewport}-diff.png`,
        pageName: `${componentName} ${viewport}`
      });

      try {
        diffResults[viewport] = { status: 'Passed', diffPixels };
        expect(diffPixels).toBeLessThan(1000);
      } catch (err) {
        diffResults[viewport] = { status: 'Failed', diffPixels };
        console.error(`❌ ${viewport} test failed`, err.message);
      }
    });
  }

  test.afterAll(async () => {
    const reportPath = path.resolve(`${diffDir}/${componentName}MultiViewportReport.html`);
    console.log('📊 Generating tabbed multi-viewport report...');

    const tabbedData = viewports.map(({ name }) => ({
      name,
      diffPixels: diffResults[name].diffPixels ?? 'Failed',
      expectedImage: `${componentName}${name}-expected.png`,
      actualImage: `${componentName}${name}-actual.png`,
      diffImage: `${componentName}${name}-diff.png`
    }));

    generateTabbedReportHtml({
      outputDir: diffDir,
      reportPath,
      pageName: componentName.replace(/([a-z])([A-Z])/g, '$1 $2'),
      viewports: tabbedData
    });

    if (fs.existsSync(reportPath)) {
      const openCmd =
        process.platform === 'win32'
          ? `start "" "${reportPath}"`
          : process.platform === 'darwin'
          ? `open "${reportPath}"`
          : `xdg-open "${reportPath}"`;

      await new Promise(resolve =>
        exec(openCmd, err => {
          if (err) console.warn('⚠️ Failed to open browser:', err.message);
          else console.log('✅ Opened visual report in browser');
          resolve(true);
        })
      );
    }
  });
});
