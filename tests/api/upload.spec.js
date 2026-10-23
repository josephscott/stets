import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { crc32 } from 'node:zlib';
import { test, expect } from '@playwright/test';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

function upload(request, name, mimeType, buffer, headers = {}) {
	return request.post('backends/php/upload.php', { headers: { 'X-Requested-With': 'stets', ...headers }, multipart: { image: { name, mimeType, buffer } } });
}

test('the upload endpoint stores an image under a random name, typed by its bytes, and serves it back', async ({ request }) => {
	const response = await upload(request, 'notes.txt', 'text/plain', png);
	const { url } = await response.json();
	expect([response.status(), url]).toEqual([201, expect.stringMatching(/^\/backends\/php\/uploads\/[0-9a-f]{32}\.png$/)]);
	expect(await (await request.get(url)).body()).toEqual(png);
});

test('the upload endpoint drops a PNG\'s metadata, unknown chunks included, but keeps what draws it', async ({ request }) => {
	const chunk = (type, data) => {
		const body = Buffer.from(type + data, 'latin1');
		const bytes = Buffer.alloc(body.length + 8);
		bytes.writeUInt32BE(data.length);
		body.copy(bytes, 4);
		bytes.writeUInt32BE(crc32(body), body.length + 4);
		return bytes;
	};
	// The signature and IHDR come first, then the color profile that must stay, and two kinds of metadata that must go.
	const [head, tail, colors] = [png.subarray(0, 33), png.subarray(33), chunk('iCCP', 'Display P3\0\0profile')];
	const sent = Buffer.concat([head, colors, chunk('tEXt', 'Location\0Home'), chunk('caBX', 'Taken by Kim'), tail]);
	const { url } = await (await upload(request, 'shot.png', 'image/png', sent)).json();
	expect(await (await request.get(url)).body()).toEqual(Buffer.concat([head, colors, tail]));
});

test('the upload endpoint refuses anything but PNG, JPEG, GIF and WebP, SVG included', async ({ request }) => {
	const response = await upload(request, 'x.svg', 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
	expect([response.status(), await response.text()]).toEqual([415, 'Only PNG, JPEG, GIF and WebP images are accepted.']);
});

// No test sends a request over post_max_size: PHP 8.3's development server crashes on one, taking every later test down with it.
test('the upload endpoint refuses an image over the server limit, saying what the limit is', async ({ request }) => {
	const response = await upload(request, 'big.png', 'image/png', Buffer.concat([png, Buffer.alloc(10.5 * 1024 * 1024)]));
	expect([response.status(), await response.text()]).toEqual([413, 'Images can be up to 10 MB.']);
});

test('the upload endpoint only accepts POSTs', async ({ request }) => {
	const response = await request.get('backends/php/upload.php');
	expect([response.status(), response.headers()['allow']]).toEqual([405, 'POST']);
});

test('the upload endpoint refuses uploads without the editor\'s header, or marked as from another site', async ({ request }) => {
	const statuses = await Promise.all([{ 'X-Requested-With': '' }, { 'Sec-Fetch-Site': 'cross-site' }].map(async headers => (await upload(request, 'x.png', 'image/png', png, headers)).status()));
	expect(statuses).toEqual([403, 403]);
});

test('the upload endpoint answers a failed save with a plain 500 message, never PHP\'s warnings', async ({ request }, testInfo) => {
	test.skip(testInfo.project.name !== 'chromium', 'It replaces the uploads folder the other projects share');
	const uploads = join(dirname(testInfo.file), '../../backends/php/uploads');
	// Move the real folder aside, never delete it: the demo keeps people's uploaded images there.
	mkdirSync(uploads, { recursive: true });
	renameSync(uploads, `${uploads}-kept`);
	writeFileSync(uploads, '');
	try {
		const response = await upload(request, 'x.png', 'image/png', png);
		expect([response.status(), await response.text()]).toEqual([500, 'The image could not be saved.']);
	} finally {
		rmSync(uploads);
		renameSync(`${uploads}-kept`, uploads);
	}
});
