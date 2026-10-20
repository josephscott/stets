import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+I wraps the selection in _', async ({ textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await textarea.press('ControlOrMeta+I');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello _world_', 7, 12]);
});

test('Cmd/Ctrl+I removes _ around an already italic selection', async ({ textarea }) => {
	await textarea.fill('Hello _world_');
	await textarea.evaluate(el => el.setSelectionRange(7, 12));
	await textarea.press('ControlOrMeta+I');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello world', 6, 11]);
});

test('Cmd/Ctrl+I leaves whitespace at the edges of the selection outside the _', async ({ textarea }) => {
	await textarea.fill('Hello world ');
	await textarea.evaluate(el => el.setSelectionRange(5, 12));
	await textarea.press('ControlOrMeta+I');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello _world_ ', 7, 12]);
});
