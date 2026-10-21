import { test, expect } from './fixtures.js';

test('a toolbar button formats the selection and leaves focus in the textarea', async ({ page, textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await page.getByRole('button', { name: 'Italic' }).click();
	await expect(textarea).toBeFocused();
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello _world_', 7, 12]);
});

test('the toolbar is one Tab stop, and arrow keys move between its buttons, wrapping at the ends', async ({ page, textarea }) => {
	await textarea.press('Shift+Tab');
	await expect(page.getByRole('button', { name: 'Heading' })).toBeFocused();
	await page.keyboard.press('ArrowLeft');
	await expect(page.getByRole('toolbar').getByRole('button').last()).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('button', { name: 'Heading' })).toBeFocused();
});
