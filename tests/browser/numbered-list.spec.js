import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+Shift+7 numbers the non-blank lines in order, then removes the numbers', async ({ textarea }) => {
	await textarea.fill('3. one\n\ntwo');
	await textarea.selectText();
	await textarea.press('ControlOrMeta+Shift+Digit7');
	expect(await textarea.inputValue()).toBe('1. one\n\n2. two');
	await textarea.press('ControlOrMeta+Shift+Digit7');
	expect(await textarea.inputValue()).toBe('one\n\ntwo');
});
