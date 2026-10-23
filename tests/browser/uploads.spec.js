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
