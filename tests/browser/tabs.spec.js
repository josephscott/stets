import { test, expect } from './fixtures.js';

test('the Preview tab hides the textarea and toolbar, and Write brings them back', async ({ page, textarea }) => {
	await page.getByRole('tab', { name: 'Preview' }).click();
	await expect(textarea).toBeHidden();
	await expect(page.getByRole('toolbar')).toBeHidden();
	await page.getByRole('tab', { name: 'Write' }).click();
	await expect(textarea).toBeVisible();
});

test('the tabs are one Tab stop, and arrow keys switch between them', async ({ page, textarea }) => {
	await textarea.press('Shift+Tab');
	await page.keyboard.press('Shift+Tab');
	await expect(page.getByRole('tab', { name: 'Write' })).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('tab', { name: 'Preview', selected: true })).toBeFocused();
	expect(await page.getByRole('tabpanel').evaluate(el => el.ariaLabelledByElements[0].textContent)).toBe('Preview');
});

test('Preview posts the Markdown to data-stets-preview and shows the HTML it returns', async ({ page, textarea }) => {
	let request;
	await page.route('**/preview.php', route => (request = route.request(), route.fulfill({ contentType: 'text/html', body: '<p><strong>Bold</strong> text</p>' })));
	await textarea.fill('**Bold** text');
	await page.getByRole('tab', { name: 'Preview' }).click();
	await expect(page.getByRole('tabpanel').locator('strong')).toHaveText('Bold');
	expect([request.method(), request.headers()['content-type'], request.postData()]).toEqual(['POST', 'text/markdown; charset=utf-8', '**Bold** text']);
});

test('Preview with nothing written says so', async ({ page, textarea }) => {
	await page.getByRole('tab', { name: 'Preview' }).click();
	await expect(page.getByRole('tabpanel')).toHaveText('Nothing to preview');
});

test('Preview shows a plain-text server error as text, and a generic message for anything else', async ({ page, textarea }) => {
	await page.route('**/preview.php', route => route.fulfill({ status: 413, contentType: 'text/plain', body: 'Too <b>large</b>' }));
	await textarea.fill('x');
	const [write, preview, panel] = [page.getByRole('tab', { name: 'Write' }), page.getByRole('tab', { name: 'Preview' }), page.getByRole('tabpanel')];
	await preview.click();
	await expect(panel).toHaveText('Too <b>large</b>');
	await page.route('**/preview.php', route => route.fulfill({ status: 404, contentType: 'text/html', body: '<h1>Not Found</h1>' }));
	await write.click();
	await preview.click();
	await expect(panel).toHaveText('Preview is unavailable right now.');
});

test('a slow preview response never replaces a newer one', async ({ page, textarea }) => {
	let requests = 0;
	await page.route('**/preview.php', async route => {
		const request = ++requests;
		await new Promise(resolve => setTimeout(resolve, request === 1 ? 500 : 0));
		await route.fulfill({ contentType: 'text/html', body: `<p>render ${request}</p>` });
	});
	await textarea.fill('x');
	const [write, preview, panel] = [page.getByRole('tab', { name: 'Write' }), page.getByRole('tab', { name: 'Preview' }), page.getByRole('tabpanel')];
	await preview.click();
	await write.click();
	await preview.click();
	await expect(panel).toHaveText('render 2');
	await page.waitForTimeout(700);
	await expect(panel).toHaveText('render 2');
});

test('a short preview keeps the height of the textarea it replaces, even when Preview is clicked again', async ({ page, textarea }) => {
	const height = (await textarea.boundingBox()).height;
	await page.getByRole('tab', { name: 'Preview' }).click();
	await page.getByRole('tab', { name: 'Preview' }).click();
	expect((await page.getByRole('tabpanel').boundingBox()).height).toBe(height);
});
