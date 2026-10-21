import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+Shift+H turns another heading level into ###', async ({ textarea }) => {
	await textarea.fill('## Title');
	await textarea.press('ControlOrMeta+Shift+H');
	expect(await textarea.inputValue()).toBe('### Title');
});
