import { test, expect } from '@playwright/test';

test('Cmd/Ctrl+B wraps the selection in **', async ({ page }) => {
	await page.goto('demo/');
	const textarea = page.getByRole('textbox', { name: 'Comment' });
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await textarea.press('ControlOrMeta+B');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello **world**', 8, 13]);
});
