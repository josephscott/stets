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

test('a YouTube poster is 16:9 on any page, even one whose own CSS sets images to height: auto', async ({ page, textarea }) => {
	await page.route(/ytimg/, route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"/>' }));
	const sizes = await page.evaluate(async () => {
		const poster = '<a class="stets-youtube" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"><img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" alt="" width="480" height="360"></a>';
		document.body.insertAdjacentHTML('beforeend', `<style>.comment img { height: auto }</style><div style="width: 800px">${poster}<div class="comment">${poster}</div></div>`);
		const images = [...document.querySelectorAll('.stets-youtube img')];
		await Promise.all(images.map(image => image.decode()));
		return images.map(image => [image.offsetWidth, image.offsetHeight]);
	});
	expect(sizes).toEqual([[800, 450], [800, 450]]);
});
