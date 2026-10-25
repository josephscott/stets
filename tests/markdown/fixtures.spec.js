import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

// Each NAME.md here goes through a backend's Markdown command, and the HTML must match NAME.html, the PHP backend's output.
// The command reads Markdown on stdin and writes HTML; for those in raw-html/, it gets --raw-html.
const command = process.env.STETS_MARKDOWN_COMMAND || 'php backends/php/markdown-cli.php';
const root = `${__dirname}/../..`;

// Both sides are read the way a browser reads them and written out one way, so only differences a reader could notice remain.
// Gone: whitespace next to blocks and runs of it in text, attribute order, token order in class and rel, <br /> or <br>, &quot; or ".
// Highlighters split and color code differently, so inside <pre> only the lines and their text count, not the token spans.
// Footnote ids lose their random part, after it's collected so the test can check there's only one.
function normalize(html) {
	const blocks = /^(blockquote|details|div|h[1-6]|hr|li|ol|p|pre|summary|table|tbody|td|th|thead|tr|ul)$/;
	const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a0/g, '&nbsp;');
	const randoms = new Set();
	const parts = [];
	(function write(parent, pre) {
		for (const node of parent.childNodes) {
			if (node.nodeType === Node.TEXT_NODE) {
				parts.push({ text: escape(pre ? node.data : node.data.replace(/[ \t\n\r\f]+/g, ' ')), exact: pre });
			} else if (node.nodeType === Node.COMMENT_NODE) {
				parts.push({ text: `<!--${node.data}-->`, exact: true });
			} else if (pre && node.localName === 'span' && !node.classList.contains('line')) {
				write(node, pre);
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const attributes = [...node.attributes].map(({ name, value }) => {
					if (name === 'class' || name === 'rel') {
						value = value.split(/\s+/).filter(Boolean).sort().join(' ');
					} else if (name === 'id' || name === 'href') {
						value = value.replace(/^(#?fn(?:ref)?-)([0-9a-f]{8})-/, (match, start, random) => (randoms.add(random), `${start}random-`));
					}
					return ` ${name}="${value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
				}).sort();
				const block = blocks.test(node.localName);
				parts.push({ tag: `<${node.localName}${attributes.join('')}>`, block });
				if (!/^(br|hr|img|input|wbr)$/.test(node.localName)) {
					write(node, pre || node.localName === 'pre');
					parts.push({ tag: `</${node.localName}>`, block });
				}
			}
		}
	})(new DOMParser().parseFromString(html, 'text/html').body, false);
	// Whitespace next to a block, or at either end, doesn't show. Each block tag goes on a line of its own, for readable diffs.
	const kept = parts.map((part, i) => {
		if (part.tag || part.exact) {
			return { text: part.tag ?? part.text, block: part.block };
		}
		const text = i === 0 || parts[i - 1].block ? part.text.trimStart() : part.text;
		return { text: i === parts.length - 1 || parts[i + 1].block ? text.trimEnd() : text };
	}).filter(part => part.text);
	return { html: kept.map((part, i) => (i && (part.block || kept[i - 1].block) ? '\n' : '') + part.text).join(''), randoms: [...randoms] };
}

const fixtures = readdirSync(__dirname, { recursive: true }).filter(file => file.endsWith('.md')).map(file => file.replace(/\\/g, '/').slice(0, -3));
for (const name of fixtures) {
	test(`${name}.md`, async ({ page }) => {
		const markdown = readFileSync(`${__dirname}/${name}.md`, 'utf8');
		const actual = execSync(`${command}${name.startsWith('raw-html/') ? ' --raw-html' : ''}`, { cwd: root, input: markdown, encoding: 'utf8' });
		const got = await page.evaluate(normalize, actual);
		const expected = await page.evaluate(normalize, readFileSync(`${__dirname}/${name}.html`, 'utf8'));
		expect(got.randoms.length).toBeLessThanOrEqual(1);
		expect(got.html).toBe(expected.html);
	});
}
