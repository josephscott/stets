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
