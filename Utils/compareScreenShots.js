// utils/compareScreenShots.js

import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

/**
 * Compares an actual screenshot with a baseline and generates a diff.
 * @param {Object} params
 * @param {Buffer} params.actualBuffer - The buffer of the actual screenshot
 * @param {string} params.actualPath - Path to save the actual screenshot
 * @param {string} params.expectedPath - Path to the baseline (Figma) image
 * @param {string} params.diffPath - Path to write the diff image
 * @param {string} params.expectedCopyPath - Path to save a copy of the baseline image for reports
 * @param {number} [params.threshold=0.1] - Color similarity threshold (0 = strict, 1 = very loose)
 * @returns {number} diffPixels - Number of differing pixels
 */
export function compareScreenshots({
  actualBuffer,
  actualPath,
  expectedPath,
  diffPath,
  expectedCopyPath,
  threshold = 0.2 
}) {
  fs.writeFileSync(actualPath, actualBuffer);

  const expectedBuffer = fs.readFileSync(expectedPath);
  const expectedPNG = PNG.sync.read(expectedBuffer);
  const actualPNG = PNG.sync.read(actualBuffer);

  const width = Math.min(expectedPNG.width, actualPNG.width);
  const height = Math.min(expectedPNG.height, actualPNG.height);

  const croppedExpected = new PNG({ width, height });
  const croppedActual = new PNG({ width, height });

  PNG.bitblt(expectedPNG, croppedExpected, 0, 0, width, height, 0, 0);
  PNG.bitblt(actualPNG, croppedActual, 0, 0, width, height, 0, 0);

  const diff = new PNG({ width, height });

  let diffPixels = 0;

  // threshold (0–1) converted to 0–255 channel value (e.g., 0.1 × 255 ≈ 26)
  const thresholdValue = Math.floor(threshold * 255);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;

      const r1 = croppedExpected.data[idx];
      const g1 = croppedExpected.data[idx + 1];
      const b1 = croppedExpected.data[idx + 2];

      const r2 = croppedActual.data[idx];
      const g2 = croppedActual.data[idx + 1];
      const b2 = croppedActual.data[idx + 2];

      const isSame =
        Math.abs(r1 - r2) < thresholdValue &&
        Math.abs(g1 - g2) < thresholdValue &&
        Math.abs(b1 - b2) < thresholdValue;

      if (isSame) {
        // ✅ Match = White
        diff.data[idx] = 255;
        diff.data[idx + 1] = 255;
        diff.data[idx + 2] = 255;
        diff.data[idx + 3] = 255;
      } else {
        diffPixels++;

        if ((r1 + g1 + b1) > (r2 + g2 + b2)) {
          // 🔴 Expected (Figma) only = RED
          diff.data[idx] = 255;
          diff.data[idx + 1] = 0;
          diff.data[idx + 2] = 0;
          diff.data[idx + 3] = 255;
        } else {
          // 🔵 Actual (Live) only = BLUE
          diff.data[idx] = 0;
          diff.data[idx + 1] = 0;
          diff.data[idx + 2] = 255;
          diff.data[idx + 3] = 255;
        }
      }
    }
  }

  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  fs.copyFileSync(expectedPath, expectedCopyPath);

  return diffPixels;
}

// test.describe.serial(`${componentName} VRT Suite`, () => {
//   for (const { name: viewport, expectedPath, htmlGen } of viewports) {
//     test(`${viewport} - ${componentName} visual should match Figma`, async ({ page }) => {
  // const diffPixels = compareManualScreenshot({
  //     viewport: `${viewport}`,
  //       expectedPath,
  //       actualPath : `./manualScreenshots/${componentName}${viewport}-actual.png`,
  //       actualCopyPath:`./diff_output/${componentName}${viewport}-actual.png`,
  //       expectedPath : `./expected_screenshots/${componentName}/${componentName}${viewport}Figma.png`,
  //       diffPath : `./diff_output/${componentName}${viewport}-diff.png`,
  //       expectedCopyPath : `./diff_output/${componentName}${viewport}-expected.png`
  //     });
//rest should be same
import { resizeImageIfNeeded } from './imageResizer.js';
import { getEnabledViewports } from './viewports.js';


export function compareManualScreenshot({
  viewport,
    actualPath,
    actualCopyPath,
  expectedPath,
  diffPath,
  expectedCopyPath,
  threshold = 0.2 

}) {

  if (!fs.existsSync(actualPath)) {
    throw new Error(`❌ Actual screenshot not found at ${actualPath}`);
  }

  if (!fs.existsSync(expectedPath)) {
    throw new Error(`❌ Expected (Figma) screenshot not found at ${expectedPath}`);
  }
  const viewportWidths = getEnabledViewports(['Desktop', 'Laptop', 'Tablet', 'Mobile']);
  const expectedWidth = viewportWidths[viewport]?.width;

  if (!expectedWidth) {
    throw new Error(`❌ Invalid viewport: "${viewport}"`);
  }

      // Resize if needed
      resizeImageIfNeeded(actualPath, expectedWidth);
      resizeImageIfNeeded(expectedPath, expectedWidth);


  const actualBuffer = fs.readFileSync(actualPath);
  const expectedBuffer = fs.readFileSync(expectedPath);
  const actualPNG = PNG.sync.read(actualBuffer);
  const expectedPNG = PNG.sync.read(expectedBuffer);

  // ✅ Ensure viewport is provided
  if (!viewport) {
    throw new Error('❌ "viewport" must be provided to compareManualScreenshot');
  }



  const width = Math.min(actualPNG.width, expectedPNG.width);
  const height = Math.min(actualPNG.height, expectedPNG.height);

  const croppedActual = new PNG({ width, height });
  const croppedExpected = new PNG({ width, height });

  PNG.bitblt(actualPNG, croppedActual, 0, 0, width, height, 0, 0);
  PNG.bitblt(expectedPNG, croppedExpected, 0, 0, width, height, 0, 0);

  const diff = new PNG({ width, height });
  const thresholdValue = Math.floor(threshold * 255);
  let diffPixels = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;

      const r1 = croppedExpected.data[idx];
      const g1 = croppedExpected.data[idx + 1];
      const b1 = croppedExpected.data[idx + 2];

      const r2 = croppedActual.data[idx];
      const g2 = croppedActual.data[idx + 1];
      const b2 = croppedActual.data[idx + 2];

      const isSame =
        Math.abs(r1 - r2) < thresholdValue &&
        Math.abs(g1 - g2) < thresholdValue &&
        Math.abs(b1 - b2) < thresholdValue;

      if (isSame) {
        // ✅ Matched pixel = white
        diff.data[idx] = 255;
        diff.data[idx + 1] = 255;
        diff.data[idx + 2] = 255;
        diff.data[idx + 3] = 255;
      } else {
        diffPixels++;

        if ((r1 + g1 + b1) > (r2 + g2 + b2)) {
          // 🔴 Missing in actual
          diff.data[idx] = 255;
          diff.data[idx + 1] = 0;
          diff.data[idx + 2] = 0;
          diff.data[idx + 3] = 255;
        } else {
          // 🔵 Extra in actual
          diff.data[idx] = 0;
          diff.data[idx + 1] = 0;
          diff.data[idx + 2] = 255;
          diff.data[idx + 3] = 255;
        }
      }
    }
  }

  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  fs.copyFileSync(expectedPath, expectedCopyPath);
  fs.copyFileSync(actualPath, actualCopyPath);

  console.log(`✅ Diff written: ${diffPath}`);
  console.log(`📎 Expected copy: ${expectedCopyPath}`);
  return diffPixels;
}