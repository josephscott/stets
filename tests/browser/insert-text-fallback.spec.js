import { test, expect } from './fixtures.js';

test('formatting falls back to setRangeText and fires input when execCommand is missing', async ({ textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await textarea.evaluate(el => el.addEventListener('input', () => el.inputs = (el.inputs || 0) + 1));
	await textarea.evaluate(() => delete Document.prototype.execCommand);
	await textarea.press('ControlOrMeta+B');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd, el.inputs])).toEqual(['Hello **world**', 8, 13, 1]);
});
