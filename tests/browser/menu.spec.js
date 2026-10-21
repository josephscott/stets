import { test, expect } from './fixtures.js';

test('the More formatting menu inserts a horizontal rule set apart by blank lines', async ({ page, textarea }) => {
	await textarea.fill('Title');
	await page.getByRole('button', { name: 'More formatting' }).click();
	await page.getByRole('menuitem', { name: 'Horizontal rule' }).click();
	await expect(page.locator('.stets-menu')).toBeHidden();
	expect(await textarea.inputValue()).toBe('Title\n\n---\n\n');
});

test('the More formatting menu opens just below its button, lined up with its right edge', async ({ page, textarea }) => {
	const more = page.getByRole('button', { name: 'More formatting' });
	await more.click();
	const [button, menu] = await Promise.all([more.boundingBox(), page.locator('.stets-menu').boundingBox()]);
	expect([Math.round(menu.y - button.y - button.height), Math.round(menu.x + menu.width - button.x - button.width)]).toEqual([4, 0]);
});

test('the More formatting menu opens from the keyboard with its first item focused, and Tab closes it', async ({ page, textarea }) => {
	await page.getByRole('button', { name: 'More formatting' }).press('Enter');
	await expect(page.getByRole('menuitem', { name: 'Horizontal rule' })).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(page.locator('.stets-menu')).toBeHidden();
});

test('arrow keys wrap around the menu, and Code block fences the selected lines', async ({ page, textarea }) => {
	await textarea.fill('one\ntwo');
	await textarea.selectText();
	await page.getByRole('button', { name: 'More formatting' }).press('Enter');
	await page.getByRole('menuitem', { name: 'Horizontal rule' }).press('ArrowUp');
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('Enter');
	expect(await textarea.evaluate(el => [el.value, el.value.slice(el.selectionStart, el.selectionEnd)])).toEqual(['```\none\ntwo\n```', 'one\ntwo']);
});

test('the Mention item appears only when data-stets-mentions is set', async ({ page, textarea }) => {
	await page.evaluate(() => stets.enhance(document.body.appendChild(document.createElement('textarea'))));
	expect(await page.locator('.stets-menu').evaluateAll(menus => menus.map(menu => menu.textContent.includes('Mention')))).toEqual([true, false]);
});

test('every tool has a menu entry, hidden until the toolbar runs out of room, that runs the tool', async ({ page, textarea }) => {
	await textarea.fill('word');
	await textarea.selectText();
	expect(await page.locator('.stets-menu-item[data-tool][hidden]').count()).toBe(11);
	await page.locator('.stets-menu-item[data-tool="bold"]').evaluate(el => el.hidden = false);
	await page.getByRole('button', { name: 'More formatting' }).click();
	await page.getByRole('menuitem', { name: 'Bold' }).click();
	expect(await textarea.inputValue()).toBe('**word**');
});

test('clicking the More formatting button again closes the menu', async ({ page, textarea }) => {
	const more = page.getByRole('button', { name: 'More formatting' });
	await more.click();
	await expect(page.getByRole('menuitem', { name: 'Horizontal rule' })).toBeFocused();
	await more.click();
	await expect(page.locator('.stets-menu')).toBeHidden();
});

test('dividers set tools that moved into the menu apart, and hide with them', async ({ page, textarea }) => {
	await page.getByRole('button', { name: 'More formatting' }).click();
	await page.locator('.stets-menu-item[data-tool="table"]').evaluate(el => el.hidden = false);
	await expect(page.getByRole('menu')).toMatchAriaSnapshot(`
		- menu:
		  - /children: equal
		  - menuitem "Table"
		  - separator
		  - menuitem "Horizontal rule"
		  - menuitem "Code block"
		  - menuitem "Mention"
	`);
});
