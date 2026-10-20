import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+Shift+X wraps the selection in ~~', async ({ textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await textarea.press('ControlOrMeta+Shift+X');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello ~~world~~', 8, 13]);
});
