import { test, expect } from '@playwright/test';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

function upload(request, name, mimeType, buffer) {
	return request.post('backends/php/upload.php', { multipart: { image: { name, mimeType, buffer } } });
}

test('the upload endpoint stores an image under a random name, typed by its bytes, and serves it back', async ({ request }) => {
	const response = await upload(request, 'notes.txt', 'text/plain', png);
	const { url } = await response.json();
	expect([response.status(), url]).toEqual([201, expect.stringMatching(/^\/backends\/php\/uploads\/[0-9a-f]{32}\.png$/)]);
	expect(await (await request.get(url)).body()).toEqual(png);
});

test('the upload endpoint refuses anything but PNG, JPEG, GIF and WebP, SVG included', async ({ request }) => {
	const response = await upload(request, 'x.svg', 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
	expect([response.status(), await response.text()]).toEqual([415, 'Send a PNG, JPEG, GIF or WebP image as the "image" field.']);
});

test('the upload endpoint refuses an image over the server limit, or a request over it, saying what the limit is', async ({ request }) => {
	const big = await upload(request, 'big.png', 'image/png', Buffer.concat([png, Buffer.alloc(10.5 * 1024 * 1024)]));
	expect([big.status(), await big.text()]).toEqual([413, 'Images can be up to 10 MB.']);
	// For a request over post_max_size, PHP's development server also prints its own warning, so only the status is checked.
	expect((await upload(request, 'huge.png', 'image/png', Buffer.concat([png, Buffer.alloc(12 * 1024 * 1024)]))).status()).toBe(413);
});
