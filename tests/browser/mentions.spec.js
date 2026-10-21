import { test, expect } from './fixtures.js';

test('typing @ and part of a name lists the matching people from data-stets-mentions', async ({ page, textarea }) => {
	await page.route('**/people.json', route => route.fulfill({ json: [{ username: 'aisha', name: 'Aisha Khan' }, { username: 'diego', name: 'Diego Fernandez' }] }));
	await textarea.evaluate(el => el.dataset.stetsMentions = 'people.json');
	await textarea.pressSequentially('Hi @fern');
	await expect(page.locator('.stets-mention')).toHaveText(['Diego Fernandez @diego']);
	await textarea.press('Space');
	await expect(page.locator('.stets-mentions')).toBeHidden();
});
