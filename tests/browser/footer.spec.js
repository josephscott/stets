import { test, expect } from './fixtures.js';

test('the form\'s own submit button moves into the footer as the Post button', async ({ page, textarea }) => {
	await expect(page.locator('.stets-footer').getByRole('button')).toHaveText('Post');
});

test('Post is disabled until there is something to post', async ({ page, textarea }) => {
	const post = page.getByRole('button', { name: 'Post' });
	await expect(post).toBeDisabled();
	await textarea.fill(' \n ');
	await expect(post).toBeDisabled();
	await textarea.fill('Hi');
	await expect(post).toBeEnabled();
});

test('Cmd/Ctrl+Enter presses Post, so not while it is disabled or an input method is composing', async ({ page, textarea }) => {
	await page.evaluate(() => document.querySelector('form').addEventListener('submit', event => {
		event.preventDefault();
		window.posts = (window.posts || 0) + 1;
	}));
	await expect(page.getByRole('button', { name: 'Post' })).toHaveAttribute('aria-keyshortcuts', process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
	await textarea.press('ControlOrMeta+Enter');
	await textarea.fill('Hi');
	await textarea.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, ctrlKey: true, isComposing: true, bubbles: true, cancelable: true })));
	await textarea.press('Enter');
	await textarea.press('ControlOrMeta+Enter');
	expect(await page.evaluate(() => window.posts)).toBe(1);
	await expect(textarea).toHaveValue('Hi\n');
});
