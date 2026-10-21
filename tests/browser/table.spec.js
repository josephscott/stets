import { test, expect } from './fixtures.js';

test('the Table button inserts a table set apart by blank lines and selects the first header', async ({ page, textarea }) => {
	await textarea.fill('Intro');
	await page.getByRole('button', { name: 'Table' }).click();
	expect(await textarea.evaluate(el => [el.value, el.value.slice(el.selectionStart, el.selectionEnd)])).toEqual(['Intro\n\n| Column | Column |\n| ------ | ------ |\n| Cell   | Cell   |\n\n', 'Column']);
});
