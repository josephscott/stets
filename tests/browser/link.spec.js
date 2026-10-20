import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+K links the selected text and selects the url placeholder', async ({ textarea }) => {
	await textarea.fill('See my site');
	await textarea.evaluate(el => el.setSelectionRange(4, 11));
	await textarea.press('ControlOrMeta+K');
	expect(await textarea.evaluate(el => [el.value, el.value.slice(el.selectionStart, el.selectionEnd)])).toEqual(['See [my site](url)', 'url']);
});
