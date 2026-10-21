import { test, expect } from './fixtures.js';

test('focus anywhere in the editor rings it, the textarea and the More formatting menu included', async ({ page, textarea }) => {
	const editor = page.locator('.stets-editor');
	await textarea.focus();
	await expect(editor).toHaveCSS('outline-style', 'solid');
	await page.getByRole('button', { name: 'More formatting' }).click();
	await expect(page.getByRole('menuitem', { name: 'Horizontal rule' })).toBeFocused();
	await expect(editor).toHaveCSS('outline-style', 'solid');
});
