import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+B wraps the selection in **', async ({ textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await textarea.press('ControlOrMeta+B');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello **world**', 8, 13]);
});

test('Cmd/Ctrl+B removes ** around an already bold selection', async ({ textarea }) => {
	await textarea.fill('Hello **world**');
	await textarea.evaluate(el => el.setSelectionRange(8, 13));
	await textarea.press('ControlOrMeta+B');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello world', 6, 11]);
});

test('Cmd/Ctrl+B leaves whitespace at the edges of the selection outside the **', async ({ textarea }) => {
	await textarea.fill('Hello world ');
	await textarea.evaluate(el => el.setSelectionRange(5, 12));
	await textarea.press('ControlOrMeta+B');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello **world** ', 8, 13]);
});
