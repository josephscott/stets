import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
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
	// The image was stored for real. Delete it: the uploads folder also holds the demo's real images.
	rmSync(join(dirname(test.info().file), '../..', (await textarea.inputValue()).match(/\((.+)\)/)[1]));
});

test('a failed upload removes its placeholder and says why, until the next upload starts', async ({ page, textarea }) => {
	const answers = [
		route => route.fulfill({ status: 415, contentType: 'text/plain', body: 'Not an image.' }),
		route => route.abort(),
		route => route.fulfill({ status: 201, json: { url: '/fish.png' } })
	];
	await page.route('**/upload.php', route => answers.shift()(route));
	const status = page.getByRole('status');
	expect(await status.evaluate(el => el.offsetHeight)).toBe(0);
	await pasteImage(textarea, 'cat.png');
	await expect(status).toHaveText('cat.png wasn\'t uploaded. Not an image.');
	await pasteImage(textarea, 'dog.png');
	await expect(status).toHaveText('dog.png wasn\'t uploaded. Try again.');
	await pasteImage(textarea, 'fish.png');
	await expect(textarea).toHaveValue('![fish](/fish.png)');
	await expect(status).toBeEmpty();
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

// Fires a drag event carrying an image, or text when no name is given, and says whether the editor caught it.
function drag(target, type, name) {
	return target.evaluate((el, [type, name]) => {
		const dataTransfer = new DataTransfer();
		name ? dataTransfer.items.add(new File(['x'], name, { type: 'image/png' })) : dataTransfer.setData('text/plain', 'x');
		return !el.dispatchEvent(Object.assign(new Event(type, { bubbles: true, cancelable: true }), { dataTransfer }));
	}, [type, name]);
}

test('an image dropped anywhere on the editor, even on the preview, uploads into the Write tab', async ({ page, textarea }) => {
	await page.route('**/upload.php', route => route.fulfill({ status: 201, json: { url: '/uploads/cat.png' } }));
	await page.getByRole('tab', { name: 'Preview' }).click();
	const preview = page.getByRole('tabpanel');
	expect([await drag(preview, 'dragenter', 'cat.png'), await drag(preview, 'dragover', 'cat.png'), await drag(preview, 'drop', 'cat.png')]).toEqual([true, true, true]);
	await expect(textarea).toHaveValue('![cat](/uploads/cat.png)');
	await expect(textarea).toBeFocused();
});

test('drags the editor cannot upload are left alone: text, and files when uploads are off', async ({ textarea }) => {
	expect(await drag(textarea, 'dragover')).toBe(false);
	await textarea.evaluate(el => delete el.dataset.stetsUpload);
	expect(await drag(textarea, 'dragover', 'cat.png')).toBe(false);
});

test('a file dragged over the editor outlines it until the drag leaves the editor, or drops', async ({ page, textarea }) => {
	await page.route('**/upload.php', route => route.abort());
	const outline = () => page.locator('.stets-editor').evaluate(el => getComputedStyle(el).outlineStyle);
	const leaveFor = selector => textarea.evaluate((el, selector) => el.dispatchEvent(Object.assign(new Event('dragleave', { bubbles: true }), { relatedTarget: document.querySelector(selector) })), selector);
	await textarea.focus();
	await drag(textarea, 'dragenter', 'cat.png');
	expect(await outline()).toBe('dotted');
	await leaveFor('.stets-toolbar');
	expect(await outline()).toBe('dotted');
	await leaveFor('body');
	expect(await outline()).toBe('solid');
	await drag(textarea, 'dragenter', 'cat.png');
	await drag(textarea, 'drop', 'cat.png');
	expect(await outline()).toBe('solid');
});

test('an upload that lands while the person is in another field leaves their focus there', async ({ page, textarea }) => {
	let finish;
	await page.route('**/upload.php', route => finish = () => route.fulfill({ status: 201, json: { url: '/cat.png' } }));
	await pasteImage(textarea, 'cat.png');
	await textarea.evaluate(el => el.addEventListener('input', () => el.dataset.heard = 'input'));
	const appearance = page.getByRole('combobox', { name: 'Appearance' });
	await appearance.focus();
	await expect.poll(() => typeof finish).toBe('function');
	await finish();
	await expect(textarea).toHaveValue('![cat](/cat.png)');
	await expect(textarea).toHaveAttribute('data-heard', 'input');
	await expect(appearance).toBeFocused();
});

test('Image… in the menu opens a picker for images and uploads the chosen ones at the caret', async ({ page, textarea }) => {
	await page.route('**/upload.php', route => route.fulfill({ status: 201, json: { url: `/${route.request().postDataBuffer().toString().match(/filename="(\w+)/)[1]}.png` } }));
	await textarea.fill('See: ');
	await page.getByRole('button', { name: 'More formatting' }).click();
	const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('menuitem', { name: 'Image…' }).click()]);
	expect([chooser.isMultiple(), await chooser.element().getAttribute('accept')]).toEqual([true, 'image/*']);
	await chooser.setFiles(['cat', 'dog'].map(name => ({ name: `${name}.png`, mimeType: 'image/png', buffer: Buffer.from('x') })));
	await expect(textarea).toHaveValue('See: ![cat](/cat.png)![dog](/dog.png)');
	// Emptied, or choosing the same image next time wouldn't count as a change.
	expect(await chooser.element().evaluate(el => el.value)).toBe('');
});

test('a drop with a file that isn\'t an image says so, and still uploads the images', async ({ page, textarea }) => {
	await page.route('**/upload.php', route => route.fulfill({ status: 201, json: { url: '/cat.png' } }));
	await textarea.evaluate(el => {
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(new File(['x'], 'notes.pdf', { type: 'application/pdf' }));
		dataTransfer.items.add(new File(['x'], 'cat.png', { type: 'image/png' }));
		el.dispatchEvent(Object.assign(new Event('drop', { bubbles: true, cancelable: true }), { dataTransfer }));
	});
	await expect(textarea).toHaveValue('![cat](/cat.png)');
	await expect(page.getByRole('status')).toHaveText('notes.pdf wasn\'t uploaded. Only images are accepted.');
});
