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
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('Enter');
	expect(await textarea.evaluate(el => [el.value, el.value.slice(el.selectionStart, el.selectionEnd)])).toEqual(['```\none\ntwo\n```', 'one\ntwo']);
});

test('the Mention and Image items appear only when data-stets-mentions and data-stets-upload are set', async ({ page, textarea }) => {
	await page.evaluate(() => stets.enhance(document.body.appendChild(document.createElement('textarea'))));
	expect(await page.locator('.stets-menu').evaluateAll(menus => menus.map(menu => ['Mention', 'Image'].map(label => menu.textContent.includes(label))))).toEqual([[true, true], [false, false]]);
});

test('every tool has a menu entry, hidden until the toolbar runs out of room, that runs the tool', async ({ page, textarea }) => {
	await textarea.fill('word');
	await textarea.selectText();
	expect(await page.locator('.stets-menu-item[data-tool][hidden]').count()).toBe(11);
	await page.getByRole('button', { name: 'More formatting' }).click();
	await page.locator('.stets-menu-item[data-tool="bold"]').evaluate(el => el.hidden = false);
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
		  - menuitem "Footnote"
		  - menuitem "Code block"
		  - menuitem "Mention"
		  - menuitem "Image…"
	`);
});

test('Footnote puts the next [^n] at the caret and its definition at the end, ready to type', async ({ page, textarea }) => {
	await textarea.fill('A fact[^2]. Another.\n\n[^2]: Old.');
	await textarea.evaluate(el => el.setSelectionRange(19, 19));
	await page.getByRole('button', { name: 'More formatting' }).click();
	await page.getByRole('menuitem', { name: 'Footnote' }).click();
	const value = 'A fact[^2]. Another[^3].\n\n[^2]: Old.\n\n[^3]: \n\n';
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual([value, value.length - 2, value.length - 2]);
});

test('Footnote brings the definition into view, in a growing textarea and in a capped one', async ({ page, textarea }) => {
	const footnote = async () => {
		await page.getByRole('button', { name: 'More formatting' }).click();
		await page.getByRole('menuitem', { name: 'Footnote' }).click();
	};
	await textarea.fill(Array.from({ length: 200 }, (_, i) => `Line ${i + 1}`).join('\n'));
	await textarea.evaluate(el => (el.setSelectionRange(6, 6), scrollTo(0, 0)));
	await footnote();
	expect(await textarea.evaluate(el => el.getBoundingClientRect().bottom - innerHeight)).toBeLessThan(1);
	await textarea.evaluate(el => (el.style.maxHeight = '200px', el.setSelectionRange(6, 6), el.scrollTop = 0, scrollTo(0, 50)));
	await footnote();
	expect(await textarea.evaluate(el => [el.scrollHeight - el.clientHeight - el.scrollTop < 1, scrollY])).toEqual([true, 50]);
});
