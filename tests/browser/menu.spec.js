import { test, expect } from './fixtures.js';

test('the More formatting menu inserts a horizontal rule set apart by blank lines', async ({ page, textarea }) => {
	await textarea.fill('Title');
	await page.getByRole('button', { name: 'More formatting' }).click();
	await page.getByRole('button', { name: 'Horizontal rule' }).click();
	await expect(page.locator('.stets-menu')).toBeHidden();
	expect(await textarea.inputValue()).toBe('Title\n\n---\n\n');
});

test('the More formatting menu opens just below its button, lined up with its right edge', async ({ page, textarea }) => {
	const more = page.getByRole('button', { name: 'More formatting' });
	await more.click();
	const [button, menu] = await Promise.all([more.boundingBox(), page.locator('.stets-menu').boundingBox()]);
	expect([Math.round(menu.y - button.y - button.height), Math.round(menu.x + menu.width - button.x - button.width)]).toEqual([4, 0]);
});
