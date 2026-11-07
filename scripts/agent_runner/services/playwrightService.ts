import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Service to capture high-DPI desktop screenshots using Headless Playwright
 * with on-demand (lazy) Chromium browser installation.
 */
export async function captureLiveScreenshot(
  liveUrl?: string,
  outputPath = './temp_screenshot.png'
): Promise<Buffer | null> {
  if (!liveUrl) {
    console.log('[PlaywrightService] No liveUrl provided. Skipping screenshot.');
    return null;
  }

  console.log(`[PlaywrightService] Initiating headless screenshot capture for: ${liveUrl}`);

  try {
    const { chromium } = await import('playwright');

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch (launchErr) {
      console.warn(
        `[PlaywrightService] Chromium browser missing (${launchErr instanceof Error ? launchErr.message : String(launchErr)}). Installing Playwright Chromium on-demand...`
      );
      const installCmd = process.platform === 'linux'
        ? 'npx playwright install --with-deps chromium'
        : 'npx playwright install chromium';
      execSync(installCmd, { stdio: 'inherit' });
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    // Navigate with 15-second networkidle timeout
    await page.goto(liveUrl, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    await browser.close();

    // Ensure directory exists if saving locally
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, buffer);

    console.log(`[PlaywrightService] Screenshot captured successfully (${buffer.length} bytes).`);
    return buffer;
  } catch (err) {
    console.warn(`[PlaywrightService] Screenshot capture failed or timed out:`, err);
    return null;
  }
}

