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
	// Counted, and stopped before the demo's own handler posts it.
	await page.evaluate(() => document.addEventListener('submit', event => {
		event.preventDefault();
		event.stopPropagation();
		window.submits = (window.submits || 0) + 1;
	}, true));
	await expect(page.getByRole('button', { name: 'Post' })).toHaveAttribute('aria-keyshortcuts', process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
	await textarea.press('ControlOrMeta+Enter');
	await textarea.fill('Hi');
	await textarea.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, ctrlKey: true, isComposing: true, bubbles: true, cancelable: true })));
	await textarea.press('Enter');
	await textarea.press('ControlOrMeta+Enter');
	expect(await page.evaluate(() => window.submits)).toBe(1);
	await expect(textarea).toHaveValue('Hi\n');
});

test('resetting the form starts the editor over: back to Write, no upload error, Post disabled', async ({ page, textarea }) => {
	await textarea.fill('Hi');
	await page.getByRole('tab', { name: 'Preview' }).click();
	await page.getByRole('status').evaluate(el => el.textContent = 'cat.png wasn\'t uploaded. Try again.');
	await page.evaluate(() => document.querySelector('form').reset());
	await expect(textarea).toBeVisible();
	await expect(page.getByRole('status')).toBeEmpty();
	await expect(page.getByRole('button', { name: 'Post' })).toBeDisabled();
});

test('the Markdown guide link opens data-stets-guide in a new tab, and is there only when it is set', async ({ page, textarea }) => {
	const [guide] = await Promise.all([page.waitForEvent('popup'), page.getByRole('link', { name: 'Markdown guide' }).click()]);
	await expect(guide).toHaveTitle('Writing with Stets');
	await page.evaluate(() => stets.enhance(document.body.appendChild(document.createElement('textarea'))));
	await expect(page.getByRole('link', { name: 'Markdown guide' })).toHaveCount(1);
});

test('in the demo, Post shows the comment below the editor and starts the editor over', async ({ page, textarea }) => {
	await textarea.fill('**Hi**');
	await page.getByRole('button', { name: 'Post' }).click();
	await expect(page.locator('#posts strong')).toHaveText('Hi');
	await expect(textarea).toHaveValue('');
});
