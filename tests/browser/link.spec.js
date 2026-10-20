import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+K links the selected text and selects the url placeholder', async ({ textarea }) => {
	await textarea.fill('See my site');
	await textarea.evaluate(el => el.setSelectionRange(4, 11));
	await textarea.press('ControlOrMeta+K');
	expect(await textarea.evaluate(el => [el.value, el.value.slice(el.selectionStart, el.selectionEnd)])).toEqual(['See [my site](url)', 'url']);
});

test('Cmd/Ctrl+K puts a selected URL in the parentheses and selects the text placeholder', async ({ textarea }) => {
	await textarea.fill('See https://example.com');
	await textarea.evaluate(el => el.setSelectionRange(4, 23));
	await textarea.press('ControlOrMeta+K');
	expect(await textarea.evaluate(el => [el.value, el.value.slice(el.selectionStart, el.selectionEnd)])).toEqual(['See [text](https://example.com)', 'text']);
});
