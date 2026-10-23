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
