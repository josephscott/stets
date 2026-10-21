import { test, expect } from './fixtures.js';

test('the More formatting menu inserts a horizontal rule set apart by blank lines', async ({ page, textarea }) => {
	await textarea.fill('Title');
	await page.getByRole('button', { name: 'More formatting' }).click();
	await page.getByRole('button', { name: 'Horizontal rule' }).click();
	await expect(page.locator('.stets-menu')).toBeHidden();
	expect(await textarea.inputValue()).toBe('Title\n\n---\n\n');
});
