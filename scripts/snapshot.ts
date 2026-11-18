import { mkdir, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const SITE_URL = (
  process.env.SITE_URL ?? "https://jakubkarwacki.github.io/"
).replace(/\/?$/, "/");
const THEMES = ["dark", "light"] as const;
const assets = fileURLToPath(new URL("../assets/", import.meta.url));

async function main(): Promise<void> {
  await mkdir(assets, { recursive: true });
  const browser = await chromium.launch();
  const shots = new Map<string, Buffer>();
  try {
    for (const theme of THEMES) {
      const page = await browser.newPage({
        viewport: { width: 1100, height: 1000 },
        deviceScaleFactor: 2,
      });
      const url = `${SITE_URL}?embed=1&theme=${theme}&view=3d`;
      const res = await page.goto(url, { waitUntil: "load", timeout: 30_000 });
      if (!res?.ok()) throw new Error(`${url} -> HTTP ${res?.status()}`);
      await page.waitForSelector('html[data-ready="1"]', {
        timeout: 30_000,
        state: "attached",
      });
      const buf = await page
        .locator("section")
        .first()
        .screenshot({ omitBackground: false });
      shots.set(theme, buf);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  // Write only after every theme succeeded, so existing images are never half-overwritten.
  for (const [theme, buf] of shots) {
    const target = `${assets}skyline-${theme}.png`;
    await writeFile(`${target}.tmp`, buf);
    await rename(`${target}.tmp`, target);
    console.log(`wrote ${target}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
