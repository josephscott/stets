import { test, expect } from './fixtures.js';

test('the editor and its menu take their colors and fonts from the theme tokens', async ({ page, textarea }) => {
	await page.locator('.stets-editor').evaluate(el => el.style.cssText = '--stets-background: rgb(1, 2, 3); --stets-text: rgb(4, 5, 6); --stets-font: serif; --stets-writing-font: cursive');
	await page.getByRole('button', { name: 'More formatting' }).click();
	await expect(page.getByRole('menu')).toHaveCSS('background-color', 'rgb(1, 2, 3)');
	await expect(page.getByRole('menuitem').first()).toHaveCSS('font-family', 'serif');
	await expect(textarea).toHaveCSS('color', 'rgb(4, 5, 6)');
	await expect(textarea).toHaveCSS('font-family', 'cursive');
});
