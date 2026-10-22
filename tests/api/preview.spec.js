import { test, expect } from '@playwright/test';

function preview(request, markdown) {
	return request.post('backends/php/preview.php', { headers: { 'Content-Type': 'text/markdown; charset=utf-8' }, data: markdown });
}

test('the preview endpoint renders GitHub Flavored Markdown as an HTML fragment', async ({ request }) => {
	const response = await preview(request, '**bold** ~~gone~~');
	const headers = response.headers();
	expect([headers['content-type'], headers['content-security-policy'], headers['x-content-type-options']]).toEqual(['text/html; charset=utf-8', 'sandbox', 'nosniff']);
	expect(await response.text()).toContain('<strong>bold</strong> <del>gone</del>');
});

test('the preview endpoint escapes raw HTML and drops unsafe links', async ({ request }) => {
	const html = await (await preview(request, '<img src=x onerror=alert(1)>\n\n[x](JaVaScRiPt:alert(1))')).text();
	expect(html).not.toMatch(/<img|href="javascript:/i);
});

test('the preview endpoint only accepts POSTed text/markdown', async ({ request }) => {
	const get = await request.get('backends/php/preview.php');
	const plain = await request.post('backends/php/preview.php', { headers: { 'Content-Type': 'text/plain' }, data: 'x' });
	expect([get.status(), get.headers()['allow'], plain.status(), await plain.text()]).toEqual([405, 'POST', 415, 'Send the Markdown as text/markdown.']);
});

test('the preview endpoint refuses requests a browser marks as coming from another site', async ({ request }) => {
	const response = await request.post('backends/php/preview.php', { headers: { 'Content-Type': 'text/markdown', 'Sec-Fetch-Site': 'cross-site' }, data: 'x' });
	expect(response.status()).toBe(403);
});

test('the preview endpoint refuses Markdown over 1 MB', async ({ request }) => {
	expect((await preview(request, 'a'.repeat(1024 * 1024 + 1))).status()).toBe(413);
});

test('the preview endpoint highlights fenced code, giving each token a light and a dark color', async ({ request }) => {
	const html = await (await preview(request, '```php\necho 1;\n```')).text();
	expect([html.includes('--phiki-light-color'), html.includes('--phiki-dark-color')]).toEqual([true, true]);
});

test('the preview endpoint shows code whose language has no letters as plain code instead of failing', async ({ request }) => {
	const html = await (await preview(request, '```123\nplain\n```')).text();
	expect(html).toMatch(/^<pre class="phiki[\s\S]*plain/);
});
