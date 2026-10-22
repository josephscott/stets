import { test, expect } from './fixtures.js';

test('Enter carries the list or quote marker onto the next line', async ({ textarea }) => {
	for (const [line, next] of [['* item', '* '], ['  9) ninth', '  10) '], ['- [x] done', '- [ ] '], ['> quote', '> ']]) {
		await textarea.fill(line);
		await textarea.press('Enter');
		expect(await textarea.inputValue()).toBe(`${line}\n${next}`);
	}
});

test('Enter on an empty item ends the list, leaving a blank line after it', async ({ textarea }) => {
	for (const [text, result] of [['- a\n- ', '- a\n\n'], ['> ', '']]) {
		await textarea.fill(text);
		await textarea.press('Enter');
		expect(await textarea.evaluate(el => [el.value, el.selectionStart])).toEqual([result, result.length]);
	}
	await textarea.fill('- foo');
	await textarea.evaluate(el => el.setSelectionRange(2, 2));
	await textarea.press('Enter');
	expect(await textarea.inputValue()).toBe('- \n- foo');
});

test('Enter picks a person from the open mention list instead of continuing the list', async ({ page, textarea }) => {
	await textarea.pressSequentially('- @mar');
	await expect(page.getByRole('listbox').getByRole('option').first()).toBeVisible();
	await textarea.press('Enter');
	expect(await textarea.inputValue()).toBe('- @maria ');
});

test('Shift+Enter, and Enter while an input method is composing, leave the list alone', async ({ textarea }) => {
	await textarea.fill('- a');
	await textarea.press('Shift+Enter');
	expect(await textarea.inputValue()).toBe('- a\n');
	await textarea.fill('- a');
	await textarea.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })));
	expect(await textarea.inputValue()).toBe('- a');
});
