import { test, expect } from './fixtures.js';

test('the editor and its menu take their colors from the theme tokens', async ({ page, textarea }) => {
	await page.locator('.stets-editor').evaluate(el => el.style.cssText = '--stets-background: rgb(1, 2, 3); --stets-text: rgb(4, 5, 6)');
	await page.getByRole('button', { name: 'More formatting' }).click();
	await expect(page.getByRole('menu')).toHaveCSS('background-color', 'rgb(1, 2, 3)');
	await expect(textarea).toHaveCSS('color', 'rgb(4, 5, 6)');
});
