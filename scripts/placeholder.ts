// Generates neutral placeholder images (run once; real ones come from scripts/snapshot.ts).
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const assets = fileURLToPath(new URL("../assets/", import.meta.url));
const palette = {
  dark: { bg: "#0d1117", fg: "#8b949e" },
  light: { bg: "#ffffff", fg: "#57606a" },
} as const;

const browser = await chromium.launch();
try {
  for (const [theme, { bg, fg }] of Object.entries(palette)) {
    const page = await browser.newPage({
      viewport: { width: 980, height: 450 },
      deviceScaleFactor: 2,
    });
    await page.setContent(
      `<body style="margin:0"><section style="width:980px;height:450px;display:grid;place-items:center;background:${bg};color:${fg};font:500 28px system-ui,sans-serif">Skyline loading…</section></body>`,
    );
    await page
      .locator("section")
      .screenshot({ path: `${assets}skyline-${theme}.png` });
    await page.close();
  }
} finally {
  await browser.close();
}
