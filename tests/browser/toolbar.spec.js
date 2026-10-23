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

test('arrow keys skip buttons that moved into the menu, and the Tab stop moves off a button that moves', async ({ page, textarea }) => {
	await textarea.press('Shift+Tab');
	await page.keyboard.press('ArrowLeft');
	await page.keyboard.press('ArrowLeft');
	await expect(page.getByRole('button', { name: 'Table' })).toBeFocused();
	await page.setViewportSize({ width: 360, height: 640 });
	await expect(page.getByRole('button', { name: 'Table' })).toBeHidden();
	await textarea.press('Shift+Tab');
	await expect(page.getByRole('button', { name: 'More formatting' })).toBeFocused();
	await page.keyboard.press('ArrowLeft');
	await expect(page.getByRole('toolbar').getByRole('button').nth(-2)).toBeFocused();
});

test('data-stets-avatar puts that image first in the header, and without it there is no avatar', async ({ page, textarea }) => {
	await expect(page.locator('.stets-header > :first-child')).toHaveAttribute('src', 'avatar.svg');
	await page.evaluate(() => stets.enhance(document.body.appendChild(document.createElement('textarea'))));
	await expect(page.locator('.stets-avatar')).toHaveCount(1);
});

test('data-stets-user names the avatar, which is otherwise decoration', async ({ page, textarea }) => {
	await expect(page.locator('.stets-avatar')).toHaveAttribute('alt', 'Sam Rivera');
	await page.evaluate(() => {
		const other = document.body.appendChild(document.createElement('textarea'));
		other.dataset.stetsAvatar = 'avatar.svg';
		stets.enhance(other);
	});
	await expect(page.locator('.stets-avatar').nth(1)).toHaveAttribute('alt', '');
});
