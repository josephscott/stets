import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

// preview.php leaves raw HTML off, so these ask stets_markdown_to_html() for it directly, as a site would for a trusted writer.
function render(markdown) {
	return execFileSync('php', ['-r', 'require $argv[1]; echo stets_markdown_to_html(stream_get_contents(STDIN), true);', `${__dirname}/../../backends/php/markdown.php`], { input: markdown, encoding: 'utf8' });
}

test('a ::: html region goes into the page as written, up to a fence as long as its own', () => {
	expect(render('<b>escaped</b>\n\n:::: html\n<div class="note"><b>live</b></div>\n:::\n::::\n')).toBe('<p>&lt;b&gt;escaped&lt;/b&gt;</p>\n<div class="note"><b>live</b></div>\n:::\n');
});

test('a ::: html region needs a blank line before it, so no paragraph hides one', () => {
	expect(render('Nice post!\n::: html\n<img src=x onerror=alert(1)>\n:::')).not.toContain('<img');
});

test('a ::: html region is balanced as a browser would parse it, so a mistake in it never swallows what follows', () => {
	const mistakes = ['<!-- unclosed', "<a href='https://example.com>docs</a>", '<iframe src="x" />', '</div></article>stray', '<plaintext>x', '<noscript><p title="</noscript><style>">x</p></noscript>'];
	expect(mistakes.map(html => render(`::: html\n${html}\n:::`))).toEqual(['<!-- unclosed-->\n', '', '<iframe src="x"></iframe>\n', 'stray\n', '', '']);
});
