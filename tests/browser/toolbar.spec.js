import { test, expect } from './fixtures.js';

test('a toolbar button formats the selection and leaves focus in the textarea', async ({ page, textarea }) => {
	await textarea.fill('Hello world');
	await textarea.evaluate(el => el.setSelectionRange(6, 11));
	await page.getByRole('button', { name: 'Italic' }).click();
	await expect(textarea).toBeFocused();
	expect(await textarea.evaluate(el => [el.value, el.selectionStart, el.selectionEnd])).toEqual(['Hello _world_', 7, 12]);
});

test('the toolbar is one Tab stop, and arrow keys move between its buttons, wrapping at the ends', async ({ page, textarea }) => {
	await textarea.press('Shift+Tab');
	await expect(page.getByRole('button', { name: 'Heading' })).toBeFocused();
	await page.keyboard.press('ArrowLeft');
	await expect(page.getByRole('toolbar').getByRole('button').last()).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('button', { name: 'Heading' })).toBeFocused();
});

test('on a narrow screen the header stays on one line and buttons that do not fit move into the menu', async ({ page, textarea }) => {
	await page.setViewportSize({ width: 360, height: 640 });
	await expect(page.getByRole('button', { name: 'Table' })).toBeHidden();
	expect((await page.locator('.stets-header').boundingBox()).height).toBeLessThan(50);
	await page.getByRole('button', { name: 'More formatting' }).click();
	await expect(page.getByRole('menuitem', { name: 'Table' })).toBeVisible();
	await page.setViewportSize({ width: 1280, height: 640 });
	await expect(page.getByRole('button', { name: 'Table' })).toBeVisible();
});
