const block = `## Section heading

Some **bold** text, some _italic_ text, a [link](https://example.com) and \`inline code\` in a longer sentence that wraps across the width of the editor.

- First list item with a few words
- Second list item with a few more words

> A quoted line of text that someone wrote earlier.

\`\`\`js
function double(value) {
	return value * 2;
}
\`\`\`

`;

export function markdown(kb) {
	return block.repeat(Math.ceil(kb * 1024 / block.length)).slice(0, kb * 1024);
}
