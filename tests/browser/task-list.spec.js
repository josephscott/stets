import { test, expect } from './fixtures.js';

test('Cmd/Ctrl+Shift+L treats checked and unchecked tasks alike, removing both', async ({ textarea }) => {
	await textarea.fill('- [x] done\n- [ ] todo');
	await textarea.selectText();
	await textarea.press('ControlOrMeta+Shift+L');
	expect(await textarea.inputValue()).toBe('done\ntodo');
});
