import { test, expect } from './fixtures.js';

test.use({ hasTouch: true });

test('on a touch screen the tabs, toolbar buttons, menu items and listed people are at least 44px tall', async ({ page, textarea }) => {
	const height = locator => locator.first().evaluate(el => el.getBoundingClientRect().height);
	await page.getByRole('button', { name: 'More formatting' }).click();
	const heights = await Promise.all([page.getByRole('tab'), page.getByRole('toolbar').getByRole('button'), page.getByRole('menuitem')].map(height));
	await page.keyboard.press('Escape');
	await textarea.pressSequentially('@ma');
	heights.push(await height(page.getByRole('option')));
	expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
});

test('on a touch screen a tapped toolbar button does not stay highlighted', async ({ page, textarea }) => {
	const bold = page.getByRole('button', { name: 'Bold' });
	await bold.tap();
	await expect(bold).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});
