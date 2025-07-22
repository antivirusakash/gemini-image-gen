
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8181');
  const content = await page.content();
  if (content.includes('HelloWorldTool')) {
    console.log('Test Passed: Found HelloWorldTool');
  } else {
    console.error('Test Failed: Did not find HelloWorldTool');
  }
  await browser.close();
})();
