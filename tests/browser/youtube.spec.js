import { test, expect } from './fixtures.js';

test('clicking a YouTube embed swaps in the player, playing at once, and leaves focus where it was; a click with a modifier key is left to the browser', async ({ page, textarea }) => {
	await page.route(/youtube/, route => route.abort());
	await page.evaluate(() => {
		document.body.insertAdjacentHTML('beforeend', '<a class="stets-youtube" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Video</a>');
		addEventListener('click', event => (window.prevented.push(event.defaultPrevented), event.preventDefault()));
		window.prevented = [];
	});
	await textarea.focus();
	await page.locator('a.stets-youtube').click({ modifiers: ['Shift'] });
	await page.locator('a.stets-youtube').click();
	expect(await page.evaluate(() => window.prevented)).toEqual([false, true]);
	await expect(page.locator('iframe.stets-youtube')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
	await expect(textarea).toBeFocused();
});

test('a YouTube embed played from the keyboard hands its focus to the player', async ({ page, textarea }) => {
	await page.route(/youtube/, route => route.abort());
	await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<a class="stets-youtube" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Video</a>'));
	await page.locator('a.stets-youtube').press('Enter');
	await expect(page.locator('iframe.stets-youtube')).toBeFocused();
});
