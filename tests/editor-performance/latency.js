// Time from each keydown to the frame after it, for keys that produce a character (not Shift, Meta, ...).
export async function measure(page, textarea, select, key, presses) {
	// The first keypresses after load pay the browser's one-time warm-up cost, so they aren't measured.
	for (let i = 0; i < 3; i++) {
		await textarea.evaluate(select);
		await textarea.press(key);
	}
	await page.evaluate(() => {
		window.latencies = [];
		window.inputs = 0;
		addEventListener('input', () => inputs++, true);
		addEventListener('keydown', event => event.key.length === 1 && requestAnimationFrame(() => setTimeout(() => latencies.push(performance.now() - event.timeStamp))), true);
	});
	for (let i = 1; i <= presses; i++) {
		await textarea.evaluate(select);
		await textarea.press(key);
		await page.waitForFunction(count => latencies.length === count, i);
	}
	return page.evaluate(() => ({ latencies, inputs }));
}
