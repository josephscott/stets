import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+Z undoes formatting', async ({ textarea, browserName }) => {
	test.fail(browserName === 'webkit', 'WebKit merges execCommand insertText into the previous typing undo step');
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await textarea.press('ControlOrMeta+B');
	await textarea.press('ControlOrMeta+Z');
	expect(await textarea.inputValue()).toBe('Hello world');
});
