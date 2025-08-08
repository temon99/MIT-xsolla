import fs from 'fs';
import { PNG } from 'pngjs';
import path from 'path';

/**
 * Resize image if its width does not match the expected viewport width.
 * Only updates the image if needed.
 * 
 * @param {string} imagePath - Path to the PNG image
 * @param {number} expectedWidth - Target width based on viewport
 * @returns {boolean} true if resized, false if already correct
 */
export function resizeImageIfNeeded(imagePath, expectedWidth) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`❌ Image not found: ${imagePath}`);
  }

  const buffer = fs.readFileSync(imagePath);
  const png = PNG.sync.read(buffer);

  if (png.width === expectedWidth) {
    // Width already correct — no action
    return false;
  }

  const scale = expectedWidth / png.width;
  const newHeight = Math.round(png.height * scale);

  const resized = new PNG({ width: expectedWidth, height: newHeight });

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < expectedWidth; x++) {
      const srcX = Math.floor(x / scale);
      const srcY = Math.floor(y / scale);

      const srcIdx = (png.width * srcY + srcX) << 2;
      const dstIdx = (expectedWidth * y + x) << 2;

      resized.data[dstIdx] = png.data[srcIdx];
      resized.data[dstIdx + 1] = png.data[srcIdx + 1];
      resized.data[dstIdx + 2] = png.data[srcIdx + 2];
      resized.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }

  fs.writeFileSync(imagePath, PNG.sync.write(resized));
  console.log(`🔧 Resized: ${path.basename(imagePath)} → width ${expectedWidth}px`);
  return true;
}
