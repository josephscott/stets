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
