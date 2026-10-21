import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+Shift+. quotes the unquoted non-blank lines, then removes every quote', async ({ textarea }) => {
	await textarea.fill('> one\n\ntwo');
	await textarea.selectText();
	await textarea.press('ControlOrMeta+Shift+Period');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['> one\n\n> two', 0, 12]);
	await textarea.press('ControlOrMeta+Shift+Period');
	expect(await textarea.inputValue()).toBe('one\n\ntwo');
});

test('Cmd/Ctrl+Shift+. removes one level from a nested quote', async ({ textarea }) => {
	await textarea.fill('> > text');
	await textarea.press('ControlOrMeta+Shift+Period');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['> text', 6, 6]);
});

test('Cmd/Ctrl+Shift+. on an empty line starts a quote with the cursor after the prefix', async ({ textarea }) => {
	await textarea.fill('one\n');
	await textarea.press('ControlOrMeta+Shift+Period');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['one\n> ', 6, 6]);
});
