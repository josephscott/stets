import { test, expect } from '../browser/fixtures.js';
import { markdown } from './document.js';
import { measure } from './latency.js';

const operations = [
	['typing a character', 'a', el => { const i = el.value.indexOf('longer', el.value.length >> 1); el.setSelectionRange(i, i); }],
	['Cmd/Ctrl+B', 'ControlOrMeta+B', el => { const i = el.value.indexOf('longer', el.value.length >> 1); el.setSelectionRange(i, i + 6); }],
	['Cmd/Ctrl+Shift+.', 'ControlOrMeta+Shift+Period', el => { const i = el.value.indexOf('A quoted', el.value.length >> 1); el.setSelectionRange(i, i); }],
];
// WebKit's own textarea slows down on large documents, even for plain typing that runs no stets code.
const webkitBudgets = { 100: 50, 250: 100 };

for (const kb of [10, 50, 100, 250]) {
	for (const [name, key, select] of operations) {
		test(`${name} in a ${kb} KB document stays within its latency budget`, async ({ page, textarea, browserName }) => {
			await textarea.evaluate((el, text) => { el.value = text; }, markdown(kb));
			const { latencies, inputs } = await measure(page, textarea, select, key, 10);
			expect(inputs).toBe(10);
			// One slow press in 10 is allowed: browsers have occasional one-off spikes, while slow code slows every press.
			const secondSlowest = [...latencies].sort((a, b) => b - a)[1];
			expect(secondSlowest, latencies.map(Math.round).join(' ')).toBeLessThan(browserName === 'webkit' && webkitBudgets[kb] || 33);
		});
	}
}
