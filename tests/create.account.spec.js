import{ test, expect } from '@playwright/test';

import fs from 'fs';

async function waitForVerificationCode(filePath, timeoutMs = 180000, pollMs = 1000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    console.log('Polling for verification code...');

    if (fs.existsSync(filePath)) {
      const code = fs.readFileSync(filePath, 'utf8').trim();
      console.log(`File exists. Current contents: "${code}"`);

      if (code) {
        fs.writeFileSync(filePath, '');
        return code;
      }
    }

    await new Promise(resolve => setTimeout(resolve, pollMs));
  }

  throw new Error('Timed out waiting for verification code in file');
}

test('create new UK test account', async ({page}) => {
    test.setTimeout(100000);
    await page.goto('https://dashboard-staging.ilivestock.co.uk/registration');
    await expect(page.getByRole('heading', {name: /Create (your|an) iLivestock account/i})).toBeVisible();
    const random = Math.floor(Math.random() * 100000);
    const email = `steven+test${random}@ilivestock.co.uk`;
    await page.getByLabel('Email').fill(email);
    await page.getByLabel(/^Password$/).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByRole('checkbox', { name: /Accept Privacy Policy & Terms and Conditions/i }).check();
    await page.click('button[type="submit"]');

    await expect(page.getByRole('heading', {name: /Verify your account/i})).toBeVisible();
    const verificationCode = await waitForVerificationCode('./verification-code.txt');
    
    await page.getByLabel('Verification code').fill(verificationCode);
    await page.click('button[type="submit"]');

    await expect(page.getByRole('heading', {name: /Account Details/i})).toBeVisible({ timeout: 15000 });
    await page.getByLabel('Given Name').fill('Steven');
    await page.getByLabel('Family Name').fill('Segaud');
    // 1. Focus the dropdown input
    await page.getByRole('button', {name: /select farm location/i}).click();
    // 2. Select the option from dropdown
    const locationDialog = page.getByRole('dialog');
    await locationDialog.getByRole('option', {name: '(UK) United Kingdom', exact: true}).click();
    await page.keyboard.press('Escape');
    await expect(locationDialog).toBeHidden();
    await page.getByLabel('Phone Number').fill('07934108770');
    await page.getByRole('combobox', {name: /Did you buy hardware\?$/i}).click();
    await page.getByRole('option', {name: 'Yes', exact: true}).click()
    await page.click('button[type="submit"]');

    let pricingFrame;
    await expect.poll(() => {
      pricingFrame = page.frames().find(frame => frame.url().includes('/v3/pricing-table-app'));
        return Boolean(pricingFrame);
    }, {timeout: 30000}).toBe(true);
    await expect(pricingFrame.locator('body')).toContainText(
        'iLivestock Platform',
        { timeout: 30000 }
    );

    const priceDisplay = pricingFrame.getByText('£27.50', {exact: true});
    const startTrialButton = pricingFrame.getByRole('button', {name: /start trial/i});
    
    for (const frame of page.frames()) {
        const closeButton = frame.getByRole('button', {
            name: /^(close|close intercom messenger)$/i
        });

        if (await closeButton.isVisible()) {
            await closeButton.click();
            break;
        }
    }
    
    await startTrialButton.click();

    await expect(page).toHaveURL(/checkout\.stripe\.com/);
    const emailDisplay = page.locator('.ReadOnlyFormField-title');
    await expect(emailDisplay).toHaveText(email, { timeout: 10000 });
    await expect(page.getByRole('heading', {name: /Try iLivestock Platform/i})).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="card-accordion-item"]').click();
    await expect(page.getByLabel(/card number/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/expiration/i)).toBeVisible({ timeout: 10000 });
    const cvcInput = page.getByRole('textbox', { name: /CVC/i });
    await expect(cvcInput).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Card number').fill('4242424242424242');
    await page.getByLabel(/expiration/i).fill('12/34');
    await cvcInput.fill('123');
    await page.getByLabel(/Cardholder Name/i).fill('Steven Segaud');
    await page.getByRole('button', {name: 'Enter address manually'}).click();
    await page.getByLabel(/Address line 1/i).fill('10 Downing Street');
    await page.getByLabel(/Town or city/i).fill('London');
    await page.getByLabel(/Postal code/i).fill('SW1A 1AA');
    await page.getByTestId('hosted-payment-submit-button').click();
    
    await expect(page).toHaveURL(/setup_success/, { timeout: 45000 });
    await expect(page.getByText(/your invoice is in your dashboard/i)).toBeVisible({ timeout: 15000 });     

});

test('create new US test account', async ({page}) => {
    test.setTimeout(180000);
    await page.goto('https://dashboard-staging.ilivestock.co.uk/registration');
    await expect(page.getByRole('heading', {name: /Create (your|an) iLivestock account/i})).toBeVisible();
    const random = Math.floor(Math.random() * 100000);
    const email = `steven+usatest${random}@ilivestock.co.uk`;
    await page.getByLabel('Email').fill(email);
    await page.getByLabel(/^Password$/).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByRole('checkbox', { name: /Accept Privacy Policy & Terms and Conditions/i }).check();
    await page.click('button[type="submit"]');

    await expect(page.getByRole('heading', {name: /Verify your account/i})).toBeVisible();
    const verificationCode = await waitForVerificationCode('./verification-code.txt');
    
    await page.getByLabel('Verification code').fill(verificationCode);
    await page.click('button[type="submit"]');

    await expect(page.getByRole('heading', {name: /Account Details/i})).toBeVisible({ timeout: 15000 });
    await page.getByLabel('Given Name').fill('Steven');
    await page.getByLabel('Family Name').fill('Segaud');
    await page.getByRole('button', {name: /select farm location/i}).click();
    const locationDialog = page.getByRole('dialog');
    await locationDialog.getByRole('option', {name: '(US) United States', exact: true}).click();
    await page.keyboard.press('Escape');
    await expect(locationDialog).toBeHidden();
    await page.getByLabel('Phone Number').fill('3074103456');
    await page.getByRole('combobox', {name: /Did you buy hardware\?$/i}).click();
    await page.getByRole('option', {name: 'Yes', exact: true}).click();
    await page.click('button[type="submit"]');
    
    let pricingFrame;
    await expect.poll(() => {
      pricingFrame = page.frames().find(frame => frame.url().includes('/v3/pricing-table-app'));
      return Boolean(pricingFrame);
    }, {timeout: 30000}).toBe(true);
    await expect(pricingFrame.locator('body')).toContainText(
      'iLivestock Platform',
      { timeout: 30000 }
    );

    const priceDisplay = pricingFrame.getByText('$400', {exact: true});
    const startTrialButton = pricingFrame.getByRole('button', {name: /start trial/i});

    for (const frame of page.frames()) {
      const closeButton = frame.getByRole('button', {
        name: /^(close|close intercom messenger)$/i
      });

      if (await closeButton.isVisible()) {
        await closeButton.click();
        break;
      }
    }

    await startTrialButton.click();

    await expect(page).toHaveURL(/checkout\.stripe\.com/);
    const emailDisplay = page.locator('.ReadOnlyFormField-title');
    await expect(emailDisplay).toHaveText(email, { timeout: 10000 });
    await expect(page.getByRole('heading', {name: /Try iLivestock Platform/i})).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/tax/i)).not.toBeVisible(); // US checkout should not show tax
    await page.getByRole('textbox', {name: 'Name'}).fill('Steven Segaud');
    await page.getByRole('button', {name: 'Enter address manually'}).click();
    await page.getByLabel(/Address line 1/i).fill('1600 Pennsylvania Avenue NW');
    await page.getByLabel(/Town or city/i).fill('Washington');
    await page.getByLabel(/Postal code/i).fill('20500');
    await page.getByRole('button', { name: 'Start trial' }).click();

    await expect(page).toHaveURL(/setup_success/, { timeout: 45000 });
    await expect(page.getByText(/your invoice is in your dashboard/i)).toBeVisible({ timeout: 15000 });

});

test('create new Paraguay test account', async ({page}) => {
    test.setTimeout(180000);
    await page.goto('https://dashboard-staging.ilivestock.co.uk/registration');
    await expect(page.getByRole('heading', {name: /Create (your|an) iLivestock account/i})).toBeVisible();
    const random = Math.floor(Math.random() * 100000);
    const email = `steven+paraguaytest${random}@ilivestock.co.uk`;
    await page.getByLabel('Email').fill(email);
    await page.getByLabel(/^Password$/).fill('password');
    await page.getByLabel('Confirm Password').fill('password');
    await page.getByRole('checkbox', { name: /Accept Privacy Policy & Terms and Conditions/i }).check();
    await page.click('button[type="submit"]');

    await expect(page.getByRole('heading', {name: /Verify your account/i})).toBeVisible();
    const verificationCode = await waitForVerificationCode('./verification-code.txt');
    
    await page.getByLabel('Verification code').fill(verificationCode);
    await page.click('button[type="submit"]');

    await expect(page.getByRole('heading', {name: /Account Details/i})).toBeVisible({ timeout: 15000 });
    await page.getByLabel('Given Name').fill('Steven');
    await page.getByLabel('Family Name').fill('Segaud');
    await page.getByRole('button', {name: /select farm location/i}).click();
    const locationDialog = page.getByRole('dialog');
    await locationDialog.getByRole('option', {name: '(PY) Paraguay', exact: true}).click();
    await page.keyboard.press('Escape');
    await expect(locationDialog).toBeHidden();
    await page.getByLabel('Phone Number').fill('0971234567');
    await page.getByRole('combobox', {name: /Did you buy hardware\?$/i}).click();
    await page.getByRole('option', {name: 'Yes', exact: true}).click();
    await page.click('button[type="submit"]');
    
    let pricingFrame;
    await expect.poll(() => {
      pricingFrame = page.frames().find(frame => frame.url().includes('/v3/pricing-table-app'));
      return Boolean(pricingFrame);
    }, {timeout: 30000}).toBe(true);
    await expect(pricingFrame.locator('body')).toContainText(
      'iLivestock Platform',
      { timeout: 30000 }
    );

    const priceDisplay = pricingFrame.getByText('USD 400', {exact: true});
    const startTrialButton = pricingFrame.getByRole('button', { name: /Iniciar la prueba/i });

    for (const frame of page.frames()) {
      const closeButton = frame.getByRole('button', {
        name: /^(close|close intercom messenger)$/i
      });

      if (await closeButton.isVisible()) {
        await closeButton.click();
        break;
      }
    }

    await startTrialButton.click();

    await expect(page).toHaveURL(/checkout\.stripe\.com/);
    const emailDisplay = page.locator('.ReadOnlyFormField-title');
    await expect(emailDisplay).toHaveText(email, { timeout: 10000 });
    await expect(page.getByRole('heading', {name: /Prueba iLivestock Platform/i})).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/tax/i)).not.toBeVisible(); // Paraguay checkout should not show tax
    await page.locator('#billingName').fill('Steven Segaud');
    await page.getByRole('button', {name: 'Ingresar la dirección manualmente'}).click();
    await page.getByLabel(/Línea 1 de dirección/i).fill('Av. Mariscal López 1234');
    await page.getByLabel(/Pueblo o ciudad/i).fill('Asunción');
    await page.getByLabel(/Código postal/i).fill('12345');
    await page.getByRole('button', { name: 'Comenzar prueba' }).click();

    await expect(page).toHaveURL(/setup_success/, { timeout: 45000 });
    await expect(page.getByText(/your invoice is in your dashboard/i)).toBeVisible({ timeout: 15000 });
});