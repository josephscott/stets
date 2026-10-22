import { test, expect } from './fixtures.js';

test('the editor and its menu take their colors and fonts from the theme tokens', async ({ page, textarea }) => {
	await page.locator('.stets-editor').evaluate(el => el.style.cssText = '--stets-background: rgb(1, 2, 3); --stets-text: rgb(4, 5, 6); --stets-font: serif; --stets-code-font: fantasy; --stets-writing-font: cursive');
	await page.getByRole('button', { name: 'More formatting' }).click();
	await expect(page.getByRole('menu')).toHaveCSS('background-color', 'rgb(1, 2, 3)');
	await expect(page.getByRole('menuitem').first()).toHaveCSS('font-family', 'serif');
	await expect(page.getByRole('menuitem').first().locator('span')).toHaveCSS('font-family', 'fantasy');
	await expect(textarea).toHaveCSS('color', 'rgb(4, 5, 6)');
	await expect(textarea).toHaveCSS('font-family', 'cursive');
});

test('the toolbar bar takes its tint from the accent color', async ({ page, textarea }) => {
	const header = page.locator('.stets-header');
	const tint = await header.evaluate(el => getComputedStyle(el).backgroundColor);
	await page.locator('.stets-editor').evaluate(el => el.style.setProperty('--stets-accent', 'rgb(200, 0, 0)'));
	await expect(header).not.toHaveCSS('background-color', tint);
});

test('highlighted code is dark by default, and --stets-code-scheme: light switches it', async ({ page, textarea }) => {
	await page.route('**/preview.php', route => route.fulfill({ contentType: 'text/html', body: '<pre class="phiki phiki-themes" style="background-color: #24292e"><code><span style="color: #79b8ff; --phiki-light-color: #005cc5; --phiki-dark-color: #79b8ff">x</span></code></pre>' }));
	await textarea.fill('x');
	await page.getByRole('tab', { name: 'Preview' }).click();
	const code = page.locator('.stets-preview pre');
	await expect(code).toHaveCSS('background-color', 'rgb(21, 27, 35)');
	await page.locator('.stets-editor').evaluate(el => el.style.setProperty('--stets-code-scheme', 'light'));
	await expect(code).toHaveCSS('background-color', 'rgb(246, 248, 250)');
	await expect(code.locator('span')).toHaveCSS('color', 'rgb(0, 92, 197)');
});
