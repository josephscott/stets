import { test, expect } from './fixtures.js';

test('a toolbar button formats the selection and leaves focus in the textarea', async ({ page, textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await page.getByRole('button', { name: 'Italic' }).click();
	await expect(textarea).toBeFocused();
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello _world_', 7, 12]);
});
