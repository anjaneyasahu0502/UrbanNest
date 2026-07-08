const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture all console errors
  page.on('console', m => {
    if (m.type() === 'error') console.log('BROWSER ERR:', m.text());
  });

  // Capture all requests/responses
  page.on('response', async res => {
    if (res.url().includes('/auth/register') || res.url().includes('/auth/verify-otp')) {
      console.log(`RESPONSE ${res.status()} ${res.url()}`);
    }
  });

  await page.goto('http://localhost:8080/auth/register');
  console.log('On register page, URL:', page.url());

  await page.fill('input[name="username"]', `testdbg${Date.now()}`);
  await page.fill('input[name="email"]', `testdbg${Date.now()}@ditapi.info`);
  await page.fill('input[name="password"]', 'Str0ng!Pass#99');
  await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');

  console.log('Submitting form...');
  await page.getByRole('button', { name: 'Sign Up' }).click();

  // Wait a moment
  await page.waitForTimeout(3000);

  console.log('After submit, URL:', page.url());

  // Grab flash errors if any
  const errEl = await page.$('.alert-danger');
  if (errEl) {
    const txt = await errEl.textContent();
    console.log('ERROR FLASH:', txt.trim());
  } else {
    console.log('No error flash visible');
  }

  // Grab h1
  const h1 = await page.$('h1');
  if (h1) console.log('H1:', await h1.textContent());

  await browser.close();
})();
