import { test, expect } from './fixtures.js';

test('the form\'s own submit button moves into the footer as the Post button', async ({ page, textarea }) => {
	await expect(page.locator('.stets-footer').getByRole('button')).toHaveText('Post');
});
