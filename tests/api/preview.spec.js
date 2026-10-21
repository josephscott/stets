import { test, expect } from '@playwright/test';

function preview(request, markdown) {
	return request.post('backends/php/preview.php', { headers: { 'Content-Type': 'text/markdown; charset=utf-8' }, data: markdown });
}

test('the preview endpoint renders GitHub Flavored Markdown as an HTML fragment', async ({ request }) => {
	const response = await preview(request, '**bold** ~~gone~~');
	expect(response.headers()['content-type']).toBe('text/html; charset=utf-8');
	expect(await response.text()).toContain('<strong>bold</strong> <del>gone</del>');
});

test('the preview endpoint escapes raw HTML and drops unsafe links', async ({ request }) => {
	const html = await (await preview(request, '<img src=x onerror=alert(1)>\n\n[x](JaVaScRiPt:alert(1))')).text();
	expect(html).not.toMatch(/<img|href="javascript:/i);
});
