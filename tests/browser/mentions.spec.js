import { test, expect } from './fixtures.js';

test.beforeEach(async ({ page, textarea }) => {
	await page.route('**/people.json', route => route.fulfill({ json: [{ username: 'aisha', name: 'Aisha Khan' }, { username: 'diego', name: 'Diego Fernandez' }] }));
	await textarea.evaluate(el => el.dataset.stetsMentions = 'people.json');
});

test('typing @ and part of a name lists the matching people from data-stets-mentions', async ({ page, textarea }) => {
	await textarea.pressSequentially('Hi @fern');
	await expect(page.locator('.stets-mention')).toHaveText(['Diego Fernandez @diego']);
	await textarea.press('Space');
	await expect(page.locator('.stets-mentions')).toBeHidden();
});

test('clicking a listed person replaces the @query with their username', async ({ page, textarea }) => {
	await textarea.pressSequentially('Hi @ai');
	await page.locator('.stets-mention').click();
	await expect(page.locator('.stets-mentions')).toBeHidden();
	expect(await textarea.inputValue()).toBe('Hi @aisha ');
});

test('arrow keys move the highlight and Enter inserts the highlighted person', async ({ page, textarea }) => {
	await textarea.pressSequentially('Hi @');
	await expect(page.getByRole('option')).toHaveCount(2);
	await textarea.press('ArrowDown');
	await textarea.press('Enter');
	expect(await textarea.inputValue()).toBe('Hi @diego ');
});

test('the mention list opens just below the @, on whichever line it is', async ({ page, textarea }) => {
	await textarea.pressSequentially('First\nsome words @');
	const [box, list] = await Promise.all([textarea.boundingBox(), page.getByRole('listbox').boundingBox()]);
	expect([Math.round((list.y - box.y - 8) / 21), list.x - box.x > 40]).toEqual([2, true]);
});
