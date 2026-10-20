import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+Shift+. quotes the unquoted non-blank lines, then removes every quote', async ({ textarea }) => {
	await textarea.fill('> one\n\ntwo');
	await textarea.selectText();
	await textarea.press('ControlOrMeta+Shift+Period');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['> one\n\n> two', 0, 12]);
	await textarea.press('ControlOrMeta+Shift+Period');
	expect(await textarea.inputValue()).toBe('one\n\ntwo');
});
