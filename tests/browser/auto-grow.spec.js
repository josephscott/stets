import { test, expect } from './fixtures.js';

const lines = Array.from({ length: 40 }, (_, i) => `Line ${i}`).join('\n');

test('the textarea starts at its rows height and grows with its content instead of scrolling', async ({ textarea }) => {
	const start = await textarea.evaluate(el => el.offsetHeight);
	expect(start).toBe(await textarea.evaluate(el => el.rows * parseFloat(getComputedStyle(el).lineHeight) + 16));
	await textarea.fill(lines);
	expect(await textarea.evaluate(el => el.scrollHeight - el.clientHeight)).toBe(0);
	expect(await textarea.evaluate(el => el.offsetHeight)).toBeGreaterThan(start);
});

test('dragging the resize handle sets a new minimum height that content can still grow past', async ({ page, textarea }) => {
	const box = await textarea.boundingBox();
	await page.mouse.move(box.x + box.width - 3, box.y + box.height - 3);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width - 3, box.y + box.height + 117, { steps: 6 });
	await page.mouse.up();
	const dragged = await textarea.evaluate(el => el.offsetHeight);
	await textarea.fill(lines);
	expect(await textarea.evaluate(el => el.scrollHeight - el.clientHeight)).toBe(0);
	await textarea.fill('');
	expect(await textarea.evaluate(el => el.offsetHeight)).toBe(dragged);
});
