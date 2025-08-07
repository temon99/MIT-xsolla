import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
//import { CapAuthDocCardPage } from '../../../../pages/webshop/capabilities/au';
import { compareManualScreenshot } from '../../Utils/compareScreenShots.js';
import { generateHtmlReport as generateTabbedReportHtml } from '../../Utils/HtmlReport/generateTabbedReport.js';
import { generateHtmlReport  } from '../../utils/HtmlReport/htmlReport.js';

const diffDir = './diff_output';
const componentName = 'footer';

const viewports = [
//   { name: 'Desktop', htmlGen: generateHtmlReport },
  { name: 'Laptop', htmlGen: generateHtmlReport }
//   { name: 'Tablet', htmlGen: generateHtmlReport },
//   { name: 'Mobile', htmlGen: generateHtmlReport }
].map(view => ({
  ...view,
  expectedPath: `./expected_screenshots/${componentName}/${componentName}${view.name}Figma.png`
}));

const diffResults = Object.fromEntries(viewports.map(({ name }) => [name, { status: 'Pending', diffPixels: null }]));

// SERIAL BLOCK — Ensures tests run one after another
test.describe.serial(`${componentName} VRT Suite`, () => {
  for (const { name: viewport, expectedPath, htmlGen } of viewports) {
    test(`${viewport} - ${componentName} visual should match Figma`, async ({ page }) => {
      const diffPixels = compareManualScreenshot({
        expectedPath,
        actualPath : `./manualScreenshots/${componentName}${viewport}-actual.png`,
        actualCopyPath:`./diff_output/${componentName}${viewport}-actual.png`,
        expectedPath : `./expected_screenshots/${componentName}${viewport}Figma.png`,
        diffPath : `./diff_output/${componentName}${viewport}-diff.png`,
        expectedCopyPath : `./diff_output/${componentName}${viewport}-expected.png`
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
