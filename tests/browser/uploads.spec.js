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
	await textarea.evaluate(el => delete el.dataset.stetsUpload);
	await pasteImage(textarea, 'cat.png');
	await expect(textarea).toHaveValue('See: ');
	await textarea.evaluate(el => el.dataset.stetsUpload = '../backends/php/upload.php');
	await pasteImage(textarea, 'cat.png');
	await expect(textarea).toHaveValue('See: ![cat](/uploads/cat.png)');
	expect([request.method(), request.headers()['x-requested-with'], request.postDataBuffer().includes('filename="cat.png"')]).toEqual(['POST', 'stets', true]);
});

test('in the demo, a pasted image goes through the real upload endpoint', async ({ textarea }) => {
	await textarea.evaluate(el => {
		const clipboardData = new DataTransfer();
		clipboardData.items.add(new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), c => c.charCodeAt(0))], 'pixel.png', { type: 'image/png' }));
		el.dispatchEvent(Object.assign(new Event('paste', { bubbles: true, cancelable: true }), { clipboardData }));
	});
	await expect(textarea).toHaveValue(/^!\[pixel\]\(\/backends\/php\/uploads\/[0-9a-f]{32}\.png\)$/);
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

test('two images with the same name each replace their own placeholder', async ({ page, textarea }) => {
	const routes = [];
	await page.route('**/upload.php', route => routes.push(route));
	await textarea.evaluate(el => el.dataset.stetsUpload = '../backends/php/upload.php');
	await pasteImage(textarea, 'image.png');
	await pasteImage(textarea, 'image.png');
	await expect.poll(() => routes.length).toBe(2);
	await routes[1].fulfill({ status: 201, json: { url: '/second.png' } });
	await routes[0].fulfill({ status: 201, json: { url: '/first.png' } });
	await expect(textarea).toHaveValue('![image](/first.png)![image](/second.png)');
});

test('when an upload lands, the caret stays where the person left it', async ({ page, textarea }) => {
	let finish;
	await page.route('**/upload.php', route => finish = () => route.fulfill({ status: 201, json: { url: '/cat.png' } }));
	await textarea.evaluate(el => el.dataset.stetsUpload = '../backends/php/upload.php');
	await pasteImage(textarea, 'cat.png');
	await textarea.press('End');
	await textarea.pressSequentially(' Hello world');
	await textarea.evaluate(el => el.setSelectionRange(el.value.length - 5, el.value.length - 5));
	await expect.poll(() => typeof finish).toBe('function');
	await finish();
	await expect(textarea).toHaveValue('![cat](/cat.png) Hello world');
	expect(await textarea.evaluate(el => el.value.slice(el.selectionStart))).toBe('world');
});
