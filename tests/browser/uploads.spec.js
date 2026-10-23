import { test, expect } from './fixtures.js';

function pasteImage(textarea, name) {
	return textarea.evaluate((el, name) => {
		const clipboardData = new DataTransfer();
		clipboardData.items.add(new File(['x'], name, { type: 'image/png' }));
		el.dispatchEvent(Object.assign(new Event('paste', { bubbles: true, cancelable: true }), { clipboardData }));
	}, name);
}

test('pasting an image uploads it to data-stets-upload and puts its Markdown at the caret', async ({ page, textarea }) => {
	let request;
	await page.route('**/upload.php', route => (request = route.request(), route.fulfill({ status: 201, json: { url: '/uploads/cat.png' } })));
	await textarea.fill('See: ');
	await pasteImage(textarea, 'cat.png');
	await expect(textarea).toHaveValue('See: ');
	await textarea.evaluate(el => el.dataset.stetsUpload = '../backends/php/upload.php');
	await pasteImage(textarea, 'cat.png');
	await expect(textarea).toHaveValue('See: ![cat](/uploads/cat.png)');
	expect([request.method(), request.headers()['x-requested-with'], request.postDataBuffer().includes('filename="cat.png"')]).toEqual(['POST', 'stets', true]);
});

test('a failed upload, or a lost connection, removes its placeholder', async ({ page, textarea }) => {
	let requests = 0;
	await page.route('**/upload.php', route => ++requests === 1 ? route.fulfill({ status: 415, contentType: 'text/plain', body: 'No.' }) : route.abort());
	await textarea.evaluate(el => el.dataset.stetsUpload = '../backends/php/upload.php');
	await pasteImage(textarea, 'cat.png');
	await pasteImage(textarea, 'dog.png');
	await expect(textarea).toHaveValue('');
});

test('an upload whose placeholder was deleted meanwhile is dropped', async ({ page, textarea }) => {
	await page.route('**/upload.php', route => setTimeout(() => route.fulfill({ status: 201, json: { url: '/cat.png' } }), 300));
	await textarea.evaluate(el => el.dataset.stetsUpload = '../backends/php/upload.php');
	await pasteImage(textarea, 'cat.png');
	await textarea.fill('Hello');
	await page.waitForTimeout(600);
	await expect(textarea).toHaveValue('Hello');
});
