import { test, expect } from './fixtures.js';

test('the Preview tab hides the textarea and toolbar, and Write brings them back', async ({ page, textarea }) => {
	await page.getByRole('tab', { name: 'Preview' }).click();
	await expect(textarea).toBeHidden();
	await expect(page.getByRole('toolbar')).toBeHidden();
	await page.getByRole('tab', { name: 'Write' }).click();
	await expect(textarea).toBeVisible();
});
