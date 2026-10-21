import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+Shift+8 turns lines and other list items into bullets, then removes them', async ({ textarea }) => {
	await textarea.fill('1. one\n- [ ] two\nthree');
	await textarea.selectText();
	await textarea.press('ControlOrMeta+Shift+Digit8');
	expect(await textarea.inputValue()).toBe('- one\n- two\n- three');
	await textarea.press('ControlOrMeta+Shift+Digit8');
	expect(await textarea.inputValue()).toBe('one\ntwo\nthree');
});
