(function () {
	'use strict';
	const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
	const list = /^([-*+] \[[ xX]\] |[-*+] |\d+[.)] )/;
	const tools = [
		{ name: 'heading', key: 'h', shift: true, label: 'Heading', action: textarea => toggleLines(textarea, '### ', /^### /, /^#{1,6} /) },
		{ name: 'bold', key: 'b', label: 'Bold', action: textarea => toggleInline(textarea, '**') },
		{ name: 'italic', key: 'i', label: 'Italic', action: textarea => toggleInline(textarea, '_') },
		{ name: 'quote', key: '.', code: 'Period', shift: true, label: 'Quote', action: textarea => toggleLines(textarea, '> ', /^> /) },
		{ name: 'code', key: 'e', label: 'Code', action: textarea => toggleInline(textarea, '`') },
		{ name: 'link', key: 'k', label: 'Link', action: insertLink },
		{ name: 'strikethrough', key: 'x', shift: true, label: 'Strikethrough', action: textarea => toggleInline(textarea, '~~') },
		{ name: 'bulleted-list', key: '8', code: 'Digit8', shift: true, label: 'Bulleted list', action: textarea => toggleLines(textarea, '- ', /^[-*+] (?!\[[ xX]\] )/, list) },
		{ name: 'numbered-list', key: '7', code: 'Digit7', shift: true, label: 'Numbered list', action: textarea => toggleLines(textarea, n => `${n}. `, /^\d+[.)] /, list) },
		{ name: 'task-list', key: 'l', shift: true, label: 'Task list', action: textarea => toggleLines(textarea, '- [ ] ', /^[-*+] \[[ xX]\] /, list) }
	];
	function shortcutHint(tool) {
		const key = tool.key.toUpperCase();
		return isMac ? (tool.shift ? '\u21e7' : '') + '\u2318' + key : 'Ctrl+' + (tool.shift ? 'Shift+' : '') + key;
	}
	function insertText(textarea, text) {
		// Replace only the part that changes: browsers edit large documents much faster that way.
		let { selectionStart: start, selectionEnd: end, value } = textarea;
		let from = 0, to = text.length;
		while (start < end && from < to && value[start] === text[from]) {
			start++;
			from++;
		}
		while (end > start && to > from && value[end - 1] === text[to - 1]) {
			end--;
			to--;
		}
		text = text.slice(from, to);
		textarea.focus();
		textarea.setSelectionRange(start, end);
		if (!document.execCommand?.('insertText', false, text)) {
			textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
		}
	}
	function trimmedSelection(textarea) {
		let { selectionStart: start, selectionEnd: end, value } = textarea;
		while (start < end && /\s/.test(value[start])) {
			start++;
		}
		while (end > start && /\s/.test(value[end - 1])) {
			end--;
		}
		return { start, end, value };
	}
	function toggleInline(textarea, marker) {
		const len = marker.length;
		let { start, end, value } = trimmedSelection(textarea);
		if (start >= len && value.slice(start - len, start) === marker && value.slice(end, end + len) === marker) {
			start -= len;
			end += len;
		}
		const selected = value.slice(start, end);
		const wrapped = selected.length >= len * 2 && selected.startsWith(marker) && selected.endsWith(marker);
		textarea.setSelectionRange(start, end);
		insertText(textarea, wrapped ? selected.slice(len, -len) : marker + selected + marker);
		textarea.setSelectionRange(start + (wrapped ? 0 : len), end + (wrapped ? -2 * len : len));
	}
	function insertLink(textarea) {
		const { start, end, value } = trimmedSelection(textarea);
		const selected = value.slice(start, end);
		const url = /^https?:\/\/\S+$/i.test(selected) ? selected : '';
		const text = url ? '' : selected;
		textarea.setSelectionRange(start, end);
		insertText(textarea, `[${text || 'text'}](${url || 'url'})`);
		const from = text ? start + text.length + 3 : start + 1;
		textarea.setSelectionRange(from, from + (text ? 3 : 4));
	}
	function toggleLines(textarea, prefix, mine, family = mine) {
		const make = typeof prefix === 'function' ? prefix : () => prefix;
		const { selectionStart, selectionEnd, value } = textarea;
		const start = value.slice(0, selectionStart).lastIndexOf('\n') + 1;
		const last = selectionEnd > selectionStart && value[selectionEnd - 1] === '\n' ? selectionEnd - 1 : selectionEnd;
		const newline = value.indexOf('\n', last);
		const end = newline === -1 ? value.length : newline;
		const lines = value.slice(start, end).split('\n');
		const filled = lines.filter(line => line.trim());
		const remove = filled.length > 0 && filled.every(line => mine.test(line));
		let n = 0;
		const result = lines.map(line => filled.length && !line.trim() ? line : remove ? line.replace(mine, '') : make(++n) + line.replace(family, '')).join('\n');
		textarea.setSelectionRange(start, end);
		insertText(textarea, result);
		if (selectionStart === selectionEnd) {
			const caret = Math.max(start, selectionStart + result.length - (end - start));
			textarea.setSelectionRange(caret, caret);
		} else {
			textarea.setSelectionRange(start, start + result.length);
		}
	}
	function enhance(textarea) {
		if (textarea.closest('.stets-editor')) {
			return;
		}
		const editor = document.createElement('div');
		editor.className = 'stets-editor';
		textarea.before(editor);
		editor.append(textarea);
		editor.insertAdjacentHTML('afterbegin', `<div class="stets-header">${tools.map(tool => `
			<button type="button" class="stets-tool" data-tool="${tool.name}" aria-label="${tool.label}" title="${tool.label} (${shortcutHint(tool)})"></button>`).join('')}</div>`);
		editor.querySelectorAll('.stets-tool').forEach((button, i) => {
			button.addEventListener('click', () => tools[i].action(textarea));
		});
		if (!textarea.labels.length && !textarea.hasAttribute('aria-label') && !textarea.hasAttribute('aria-labelledby')) {
			textarea.setAttribute('aria-label', 'Markdown editor');
		}
		textarea.addEventListener('keydown', event => {
			const tool = tools.find(t => (t.code ? t.code === event.code : t.key === event.key.toLowerCase()) && Boolean(t.shift) === event.shiftKey);
			if ((isMac ? event.metaKey : event.ctrlKey) && !event.altKey && tool) {
				event.preventDefault();
				tool.action(textarea);
			}
		});
	}
	function init() {
		document.querySelectorAll('textarea[data-stets]').forEach(enhance);
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
	window.stets = { enhance };
})();
