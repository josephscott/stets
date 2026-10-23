import { test, expect } from './fixtures.js';

test('only the platform modifier, without Shift or Alt, triggers formatting', async ({ textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	for (const keys of [process.platform === 'darwin' ? 'Control+B' : 'Meta+B', 'ControlOrMeta+Shift+B', 'ControlOrMeta+Alt+B']) {
		await textarea.press(keys);
	}
	expect(await textarea.inputValue()).toBe('Hello world');
});

test('a tool\'s shortcut is named in aria-keyshortcuts, by the keys pressed, on its button and its menu entry', async ({ page, textarea }) => {
	const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
	await expect(page.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-keyshortcuts', `${modifier}+B`);
	await expect(page.getByRole('button', { name: 'Quote' })).toHaveAttribute('aria-keyshortcuts', `${modifier}+Shift+.`);
	await expect(page.locator('.stets-menu-item[data-tool="quote"]')).toHaveAttribute('aria-keyshortcuts', `${modifier}+Shift+.`);
});
