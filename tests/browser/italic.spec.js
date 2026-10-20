import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+I wraps the selection in _', async ({ textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await textarea.press('ControlOrMeta+I');
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello _world_', 7, 12]);
});
