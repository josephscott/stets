import { test, expect } from './fixtures.js';

test('only the platform modifier, without Shift or Alt, triggers formatting', async ({ textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	for (const keys of [process.platform === 'darwin' ? 'Control+B' : 'Meta+B', 'ControlOrMeta+Shift+B', 'ControlOrMeta+Alt+B']) {
		await textarea.press(keys);
	}
	expect(await textarea.inputValue()).toBe('Hello world');
});
