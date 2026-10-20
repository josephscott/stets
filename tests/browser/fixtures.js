import { test as base } from '@playwright/test';
export { expect } from '@playwright/test';

export const test = base.extend({
	textarea: async ({ page }, use) => {
		await page.goto('demo/');
		await use(page.getByRole('textbox', { name: 'Comment' }));
	},
});
