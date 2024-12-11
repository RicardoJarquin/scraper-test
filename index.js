const { chromium } = require('playwright');
//const stealth = require('playwright-extra-plugin-stealth');

(async () => {
    const browser = await chromium.connectOverCDP(
        `wss://connect.browserbase.com?apiKey=bb_live_FFA-rF-1uE_kQPUoXVj8yzCRevk`
      );
    // Getting the default context to ensure the sessions are recorded.
    const defaultContext = browser.contexts()[0];
    const page = defaultContext.pages()[0];
  
    await page.goto("https://browserbase.com/");
    await page.close();
    await browser.close();
  })().catch((error) => console.error(error.message));